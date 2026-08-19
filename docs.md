## How to run this project

1. Clone this repo
2. mv .env.example .env => fill it
3. pnpm install
4. docker compose up -d --build
5. there are 2 option, either using Dev Container or install venv.
    - Option 1 venv:
        ```bash
        cd ai-backend && python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
        ```
    - Option 2 Dev Container:
        ```bash
            NONE
        ```
        
## How to add pip package to our local library
1. install any libraries you need
2. upload to requirements.txt
```bash
    pip freeze > requirements.txt
```
