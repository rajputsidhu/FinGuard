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
