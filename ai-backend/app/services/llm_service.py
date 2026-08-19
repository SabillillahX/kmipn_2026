import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
import numpy as np
from sklearn.cluster import DBSCAN, AgglomerativeClustering
from app.core.config import settings
from app.schemas.ai_request import Report, MasterTicket, ReportDetail

tokenizer = None
model = None
danger_embeddings = None
blockage_embeddings = None

danger_anchors = [
    "kejadian gawat darurat yang mengancam keselamatan jiwa",
    "kecelakaan parah ada korban terluka atau meninggal",
    "situasi sangat berbahaya butuh bantuan ambulans pemadam",
    "bencana alam mengancam keselamatan warga sekitar"
]

blockage_anchors = [
    "jalan tertutup total tidak bisa dilewati kendaraan",
    "akses jalan terblokir oleh reruntuhan pohon longsor",
    "jalan buntu terhalang tidak bisa lewat",
    "lalu lintas lumpuh total tertutup"
]

def load_model():
    global tokenizer, model, danger_embeddings, blockage_embeddings
    tokenizer = AutoTokenizer.from_pretrained(settings.MODEL_NAME)
    model = AutoModel.from_pretrained(settings.MODEL_NAME).to(settings.DEVICE)
    model.eval()
    danger_embeddings = get_embeddings(danger_anchors)
    blockage_embeddings = get_embeddings(blockage_anchors)

def get_embeddings(texts: list[str]) -> torch.Tensor:
    if not texts:
        return torch.empty((0, 768), device=settings.DEVICE)
    inputs = tokenizer(texts, padding=True, truncation=True, return_tensors="pt", max_length=512)
    inputs = {k: v.to(settings.DEVICE) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = model(**inputs)
    cls_embeddings = outputs.last_hidden_state[:, 0, :]
    normalized_embeddings = F.normalize(cls_embeddings, p=2, dim=1)
    return normalized_embeddings

def process_clustering(reports: list[Report]) -> list[MasterTicket]:
    if not reports:
        return []

    report_texts = [r.text for r in reports]
    report_embeddings = get_embeddings(report_texts)

    danger_sims = torch.mm(report_embeddings, danger_embeddings.t()).cpu().numpy()
    max_danger_sims = np.max(danger_sims, axis=1)

    blockage_sims = torch.mm(report_embeddings, blockage_embeddings.t()).cpu().numpy()
    max_blockage_sims = np.max(blockage_sims, axis=1)

    report_details = {}
    for idx, r in enumerate(reports):
        sim_danger = max_danger_sims[idx]
        sim_block = max_blockage_sims[idx]

        if sim_danger >= 0.75:
            risk = 4
        elif sim_danger >= 0.65:
            risk = 3
        elif sim_danger >= 0.55:
            risk = 2
        else:
            risk = 1

        blocked = bool(sim_block >= 0.70)

        report_details[r.report_id] = ReportDetail(
            report_id=r.report_id,
            ai_risk_score=risk,
            ai_is_blocked=blocked
        )

    coords = np.radians(np.array([[r.latitude, r.longitude] for r in reports]))
    eps_rad = settings.SPATIAL_EPSILON / settings.EARTH_RADIUS

    db = DBSCAN(eps=eps_rad, min_samples=settings.SPATIAL_MIN_PTS, metric='haversine')
    spatial_labels = db.fit_predict(coords)

    master_tickets = []
    unique_labels = set(spatial_labels)
    
    for label in unique_labels:
        if label == -1:
            indices = np.where(spatial_labels == label)[0]
            for idx in indices:
                rep_id = reports[idx].report_id
                master_tickets.append(
                    MasterTicket(
                        master_latitude=reports[idx].latitude,
                        master_longitude=reports[idx].longitude,
                        representative_text=reports[idx].text,
                        member_ids=[rep_id],
                        member_reports=[report_details[rep_id]]
                    )
                )
            continue

        indices = np.where(spatial_labels == label)[0]
        cluster_reports = [reports[i] for i in indices]
        texts = [r.text for r in cluster_reports]
        
        embeddings = get_embeddings(texts)
        sim_matrix = torch.mm(embeddings, embeddings.t()).cpu().numpy()
        dist_matrix = np.clip(1.0 - sim_matrix, 0.0, 2.0)
        np.fill_diagonal(dist_matrix, 0.0)

        if len(cluster_reports) > 1:
            agg = AgglomerativeClustering(
                n_clusters=None,
                distance_threshold=(1.0 - settings.SIMILARITY_THRESHOLD),
                metric='precomputed',
                linkage='average'
            )
            semantic_labels = agg.fit_predict(dist_matrix)
        else:
            semantic_labels = np.array([0])

        for sem_label in set(semantic_labels):
            sem_indices = np.where(semantic_labels == sem_label)[0]
            member_ids = [cluster_reports[i].report_id for i in sem_indices]
            member_reports = [report_details[mid] for mid in member_ids]
            
            lats = [cluster_reports[i].latitude for i in sem_indices]
            lons = [cluster_reports[i].longitude for i in sem_indices]
            master_latitude = sum(lats) / len(lats)
            master_longitude = sum(lons) / len(lons)
            
            representative_text = cluster_reports[sem_indices[0]].text
            
            master_tickets.append(
                MasterTicket(
                    master_latitude=master_latitude,
                    master_longitude=master_longitude,
                    representative_text=representative_text,
                    member_ids=member_ids,
                    member_reports=member_reports
                )
            )

    return master_tickets

