FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN apt-get update && apt-get install -y git
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Install xlsxwriter from GitHub (master branch, which has add_pivot_table)
RUN pip install git+https://github.com/jmcnamara/XlsxWriter.git

CMD ["uvicorn", "export_pivot_api:app", "--host", "0.0.0.0", "--port", "8000"]