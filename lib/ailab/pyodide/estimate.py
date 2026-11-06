import json

import numpy as np


def rounded(values, digits=0):
    factor = 10**digits
    return np.floor(np.asarray(values, dtype=float) * factor + 0.5) / factor


def quantities(items, ratios):
    kinds = np.array([item["kind"] for item in items])
    count = np.array([item["count"] for item in items], dtype=float)
    a = np.array([item["a"] for item in items], dtype=float)
    b = np.array([item["b"] for item in items], dtype=float)
    c = np.array([item["c"] for item in items], dtype=float)
    volume = count * a * b * c
    formwork = np.select(
        [kinds == "beam", kinds == "slab"],
        [count * (a + 2 * b) * c, count * a * b],
        default=count * 2 * (a + b) * c,
    )
    steel = volume * np.array([ratios[kind] for kind in kinds], dtype=float)
    return rounded(volume, 2), rounded(formwork, 2), rounded(steel)


def estimate(items, prices, ratios, contingency):
    volume, formwork, steel = quantities(items, ratios)
    concrete = float(rounded(volume.sum(), 2))
    totals = {
        "concrete": (concrete, "m3"),
        "steel": (float(rounded(steel.sum())), "kg"),
        "formwork": (float(rounded(formwork.sum(), 2)), "m2"),
        "labor": (concrete, "m3"),
    }
    lines = [
        {"id": key, "quantity": quantity, "unit": unit, "price": prices[key], "cost": float(rounded(quantity * prices[key]))}
        for key, (quantity, unit) in totals.items()
    ]
    subtotal = sum(line["cost"] for line in lines)
    reserve = float(rounded(subtotal * contingency))
    return {
        "items": [
            {"id": item["id"], "volume": float(v), "formwork": float(f), "steel": float(s)}
            for item, v, f, s in zip(items, volume, formwork, steel)
        ],
        "lines": lines,
        "subtotal": subtotal,
        "contingency": reserve,
        "total": subtotal + reserve,
    }


def estimate_json(payload):
    data = json.loads(payload)
    return json.dumps(estimate(data["items"], data["prices"], data["ratios"], data["contingency"]))
