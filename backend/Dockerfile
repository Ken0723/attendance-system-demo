FROM public.ecr.aws/sam/build-python3.12:latest

COPY requirements.txt /app/
COPY run_seed.py /app/
COPY . /app
WORKDIR /app

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 8080

ENTRYPOINT ["gunicorn", "-b", ":8080", "app.main:APP", "--workers=1", "--threads=2", "--timeout=120"]