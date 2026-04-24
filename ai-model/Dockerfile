FROM python:3.10

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# 🔥 IMPORTANT: Download model during build (not runtime)
RUN python predict.py

CMD ["gunicorn", "-b", "0.0.0.0:5001", "app:app"]