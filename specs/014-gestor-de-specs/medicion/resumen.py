"""Convierte resultados.json en tablas Markdown. Uso: python -I resumen.py resultados.json"""
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
d = json.load(open(sys.argv[1], encoding="utf-8"))
m = d["maquina"]
print(f"Máquina: {m['cpu']}, {m['hilos']} hilos, {m['ram_gb']} GB, Node {m['node']}, {m['plataforma']}")
print(f"Corpus: {d['corpus']['lineas']} líneas, {d['corpus']['bytes'] / 1e3:.0f} KB\n")
print("| Capa | Tiempo | Pico RSS | Detalle |")
print("|---|---|---|---|")
for k, v in d["capas"].items():
    extra = {x: y for x, y in v.items() if x not in ("ms", "rss_pico_mb")}
    t = f"{v['ms'] / 1000:.1f} s" if v["ms"] >= 1000 else f"{v['ms']:.0f} ms"
    print(f"| {k} | {t} | {v['rss_pico_mb']} MB | {json.dumps(extra, ensure_ascii=False)} |")
print("\n| Detector | TP | FP | FN | Precisión | Recall |")
print("|---|---|---|---|---|---|")
for k, v in d["precision"].items():
    if isinstance(v, dict) and "tp" in v:
        print(f"| {k} | {v['tp']} | {v['fp']} | {v['fn']} | {v['precision']} | {v['recall']} |")
    elif isinstance(v, dict) and "casi_duplicado" in v:
        for sub in ("casi_duplicado", "contradiccion"):
            s = v[sub]
            print(f"| {k} → {sub} | {s['tp']} | {s['fp']} | {s['fn']} | {s['precision']} | {s['recall']} |")
for k, v in d["precision"].items():
    if isinstance(v, dict) and "contradiccion_por_tipo" in v:
        print(f"\n{k}: por tipo {json.dumps(v['contradiccion_por_tipo'], ensure_ascii=False)}; techo de recall de candidatos {json.dumps(v['techo_recall_candidatos'])}")
        if "semanticas_puntaje" in v:
            for s in v["semanticas_puntaje"]:
                print(f"  {s}")
for k, v in d["precision"].items():
    if k.startswith(("semanticas_", "oraculo_")):
        print(f"\n{k}:")
        for s in v:
            print(f"  {s}")
for k in ("traza_bm25", "traza_embeddings", "traza_hibrida_rrf"):
    if k in d["precision"]:
        t = d["precision"][k]
        print(f"\n{k}: top-5 {t['acierto_top5']}")
        for r in t["filas"]:
            print(f"  {r['id']} existe={r['existe']} top5={r['acierto_top5']} top1={r['top1']} ({r['puntaje_top1']})")
if "acronimo_sin_definir" in d["precision"]:
    print("\nFP acrónimos:", d["precision"]["acronimo_sin_definir"].get("fp_detalle"))
for n in d.get("notas", []):
    print("\nnota:", json.dumps(n, ensure_ascii=False))
