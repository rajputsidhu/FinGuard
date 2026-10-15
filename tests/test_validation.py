import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.main import app

client = TestClient(app)

def get_base_payload():
    payload = {f"V{i}": 0.0 for i in range(1, 29)}
    payload.update({"Time": 3600.0, "Amount": 100.0})
    return payload

def test_validation_rejects_negative_amount():
    """Verifies that negative transaction amounts are rejected with HTTP 422."""
    payload = get_base_payload()
    payload["Amount"] = -50.0
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()

def test_validation_rejects_negative_time():
    """Verifies that negative transaction times are rejected with HTTP 422."""
    payload = get_base_payload()
    payload["Time"] = -10.0
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_validation_rejects_nan_value():
    """Verifies that NaN inputs are rejected with HTTP 422."""
    payload = get_base_payload()
    payload["V14"] = "NaN"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_validation_rejects_infinity_value():
    """Verifies that Infinity inputs are rejected with HTTP 422."""
    payload = get_base_payload()
    payload["Amount"] = "Infinity"
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_validation_rejects_missing_field():
    """Verifies that missing required fields trigger HTTP 422."""
    payload = get_base_payload()
    del payload["V14"]
    response = client.post("/predict", json=payload)
    assert response.status_code == 422

def test_validation_handles_large_values():
    """Verifies large transaction amounts pass validation."""
    payload = get_base_payload()
    payload["Amount"] = 1_500_000.0
    response = client.post("/predict", json=payload)
    assert response.status_code == 200

def test_validation_rejects_oversized_csv_payload():
    """Verifies that uploaded CSV exceeding MAX_UPLOAD_SIZE_BYTES triggers HTTP 413."""
    from unittest.mock import patch
    from api.config import settings
    
    with patch.object(settings, "MAX_UPLOAD_SIZE_BYTES", 50):
        oversized_content = "Time,Amount,V1\n0.0,10.0,0.5\n" * 5
        files = {"file": ("oversized.csv", oversized_content, "text/csv")}
        response = client.post("/predict-file", files=files)
        assert response.status_code == 413
        assert "exceeds maximum allowed upload size" in response.json()["detail"]


def test_validation_rejects_excessive_row_count():
    """Verifies that uploaded CSV exceeding max rows triggers HTTP 422."""
    headers = "Time,Amount," + ",".join([f"V{i}" for i in range(1, 29)]) + "\n"
    # Create 10,005 rows (limit is 10,000)
    row = "0.0,10.0," + ",".join(["0.0"] * 28) + "\n"
    excessive_content = headers + (row * 10_005)
    files = {"file": ("too_many_rows.csv", excessive_content, "text/csv")}
    response = client.post("/predict-file", files=files)
    assert response.status_code == 422
    assert "exceeds maximum allowed limit" in response.json()["detail"]


