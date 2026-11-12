"""Genera una spec sintetica de ~10.000 lineas con defectos sembrados y su verdad (truth.json).

Uso: python -I generar_corpus.py <carpeta_salida> [semilla]
Todo es determinista con la semilla: la misma semilla produce los mismos bytes.
"""
import json
import random
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 14
rng = random.Random(SEED)

MODULOS = [
    "Compradores", "Cuentas de usuario", "Pagos", "Facturación", "Carrito", "Notificaciones", "Reportes", "Auditoría",
    "Seguridad", "Integraciones", "Catálogo", "Pedidos", "Inventario", "Envíos", "Devoluciones", "Promociones",
    "Soporte", "Vendedores", "Proveedores", "Bodegas", "Rutas", "Transportadoras", "Registro", "Documentos",
    "Reseñas", "Agenda de entregas", "Encuestas", "Fidelización", "Suscripciones", "Garantías", "Tarifas de envío",
    "Impuestos", "Portal web", "App móvil", "Back office", "Analítica", "Exportaciones", "Importaciones", "Archivo",
    "Configuración",
]
ACTORES = ["comprador", "vendedor", "supervisor", "administrador", "auditor", "analista", "operador de bodega", "transportador"]
ACCIONES = [
    "consultar", "crear", "editar", "anular", "aprobar", "rechazar", "exportar", "imprimir", "descargar", "adjuntar",
    "archivar", "restaurar", "duplicar", "comparar", "filtrar", "ordenar", "compartir", "firmar", "programar", "reasignar",
    "bloquear", "desbloquear", "validar", "conciliar", "etiquetar", "comentar", "priorizar", "cerrar", "reabrir", "notificar",
    "auditar", "simular", "previsualizar", "certificar", "escalar", "suspender",
]
OBJETOS = [
    "la factura", "el pedido", "la orden de compra", "el carrito", "la cuenta de usuario", "el reporte mensual",
    "la devolución", "el envío", "la promoción", "el ticket de soporte", "la cotización", "el catálogo de temporada",
    "la nota de devolución", "el recibo", "la reseña", "la garantía", "el documento de importación",
    "el comprobante de entrega", "el conteo de inventario", "el lote de despacho", "la tarifa de envío", "el proveedor",
    "el producto", "el inventario", "la encuesta", "la cita de entrega", "la suscripción", "el certificado de origen",
    "la alerta de stock", "el registro de auditoría", "la regla de precios", "el usuario interno", "el rol",
    "la plantilla de correo", "la campaña", "el cupón", "la guía de transporte", "la orden de recogida",
    "el acuerdo de servicio", "la ficha de producto", "el reclamo", "la transferencia entre bodegas", "el saldo de puntos",
    "el destinatario", "la tarjeta de regalo", "el cupo de bodega", "la bodega", "la ruta de reparto",
    "la liquidación de fletes", "el anticipo al proveedor", "el pedido vencido", "el plan de entregas",
    "la etiqueta de envío", "la lista de deseos", "la factura electrónica", "el manifiesto de carga",
]
CONDICIONES = [
    "", " desde el portal web", " desde la app móvil", " en el back office", " con su sesión activa",
    " cuando el estado sea pendiente", " dentro del horario hábil", " después de la aprobación del supervisor",
    " si tiene el permiso correspondiente", " para el periodo seleccionado", " con trazabilidad del cambio",
]
VAGOS = [
    ("de forma rápida", "rápida"), ("de manera fácil de usar", "fácil de usar"), ("de forma adecuada", "adecuada"),
    ("de forma eficiente", "eficiente"), ("en la medida de lo posible", "en la medida de lo posible"),
    ("si es posible", "si es posible"), ("de forma intuitiva", "intuitiva"), ("con un rendimiento óptimo", "óptimo"),
    ("según corresponda", "según corresponda"), ("y/o", "y/o"), ("entre otros", "entre otros"), ("etc.", "etc."),
    ("con la mejor experiencia", "la mejor"), ("de forma robusta", "robusta"), ("lo antes posible", "lo antes posible"),
]
GLOSARIO = {
    "Comprador": "Persona con una cuenta que compra en la tienda.",
    "Vendedor": "Comercio que publica productos en la tienda.",
    "Orden de compra": "Pedido formal de mercancía a un proveedor.",
    "Lote de despacho": "Conjunto de envíos que salen juntos de una bodega.",
    "Guía de transporte": "Documento que acompaña un envío hasta su destino.",
    "Bodega": "Lugar físico donde se guarda el inventario.",
    "Ticket": "Caso de soporte con número único y estado.",
    "Periodo": "Rango de fechas cerrado que usa un reporte.",
    "Back office": "Aplicación interna para usuarios del negocio.",
    "Plan de entregas": "Calendario de entregas de un pedido grande.",
}
ACRONIMOS_DEFINIDOS = ["SKU", "SLA", "API", "PDF", "OTP", "IVA", "SMS"]
ACRONIMOS_SIN_DEFINIR = ["WMS", "TMS", "POS", "EDI", "RMA", "ETA", "CSAT", "NPS", "GTIN", "EAN", "CRM", "ERP", "MFA", "LDAP", "CDN"]

CANTIDADES = [
    ("la sesión del {a} en {o} DEBE expirar tras {v} minutos de inactividad", "minutos", [5, 10, 15, 20, 30]),
    ("el número máximo de intentos fallidos del {a} al aprobar {o} DEBE ser {v}", "", [3, 4, 5, 6]),
    ("el tamaño máximo de un archivo adjunto en {o} DEBE ser {v} MB", "MB", [5, 10, 20, 25]),
    ("los registros de auditoría de {o} DEBEN conservarse durante {v} días", "días", [90, 180, 365, 730]),
    ("el tiempo de respuesta al consultar {o} DEBE ser menor a {v} ms en el percentil 95", "ms", [200, 300, 500, 800]),
    ("el código OTP para aprobar {o} DEBE vencer a los {v} segundos", "segundos", [60, 90, 120, 300]),
    ("la exportación de {o} DEBE admitir hasta {v} filas por archivo", "filas", [10000, 50000, 100000]),
]
PARAFRASIS = {
    "consultar": ["ver", "revisar"], "crear": ["registrar", "dar de alta"], "editar": ["modificar", "actualizar"],
    "anular": ["cancelar", "invalidar"], "exportar": ["sacar", "bajar"], "descargar": ["bajar", "obtener"],
    "adjuntar": ["anexar", "cargar"], "archivar": ["guardar en el archivo"], "compartir": ["enviar"],
    "aprobar": ["autorizar"], "rechazar": ["denegar"], "imprimir": ["sacar en papel"], "filtrar": ["segmentar"],
    "bloquear": ["inhabilitar"], "desbloquear": ["habilitar de nuevo"], "validar": ["verificar"],
    "notificar": ["avisar sobre"], "cerrar": ["finalizar"], "reabrir": ["volver a abrir"], "firmar": ["firmar digitalmente"],
    "programar": ["agendar"], "reasignar": ["transferir"], "comparar": ["contrastar"], "ordenar": ["organizar"],
    "duplicar": ["copiar"], "restaurar": ["recuperar"], "etiquetar": ["marcar"], "comentar": ["anotar"],
    "priorizar": ["jerarquizar"], "conciliar": ["cuadrar"], "auditar": ["revisar en auditoría"], "simular": ["proyectar"],
    "previsualizar": ["ver en borrador"], "certificar": ["acreditar"], "escalar": ["subir de nivel"], "suspender": ["pausar"],
}
SEMANTICAS = [
    ("Los datos personales de los compradores DEBEN almacenarse únicamente en servidores ubicados en la Unión Europea.",
     "Los datos personales de los compradores DEBEN replicarse en una región de nube de Estados Unidos para su almacenamiento."),
    ("La autenticación de los vendedores DEBE hacerse solo con usuario y contraseña.",
     "Todo inicio de sesión de un vendedor DEBE exigir un segundo factor de autenticación."),
    ("Los reportes mensuales DEBEN generarse en tiempo real cada vez que se consultan.",
     "Los reportes mensuales DEBEN generarse una sola vez al cierre del periodo y luego solo leerse."),
    ("El comprador DEBE poder cerrar su cuenta desde la app móvil sin intervención de un operador.",
     "El cierre de una cuenta DEBE ser realizado exclusivamente por un administrador en el back office."),
    ("Las notificaciones al comprador DEBEN enviarse solo por correo electrónico.",
     "Las notificaciones al comprador DEBEN enviarse únicamente por SMS."),
    ("El conteo de inventario DEBE ejecutarse de forma automática a la medianoche.",
     "El conteo de inventario DEBE iniciarlo manualmente un operador de bodega cada mañana."),
    ("El sistema DEBE permitir pagos parciales de un pedido.",
     "Cada pedido DEBE pagarse en una sola transacción por el valor total."),
    ("Los precios del catálogo DEBEN mostrarse con IVA incluido.",
     "Los precios del catálogo DEBEN mostrarse sin impuestos y el IVA se suma al final."),
    ("Un pedido despachado DEBE poder modificarse hasta que llegue al comprador.",
     "Un pedido NO DEBE modificarse una vez que fue despachado."),
    ("El historial de cambios de una orden de compra DEBE ser visible para el proveedor.",
     "El historial de cambios de una orden de compra DEBE ser visible solo para usuarios internos."),
]

lines: list[str] = []
truth = {"seed": SEED, "exact_dup": [], "near_dup": [], "contradiction": [], "broken_ref": [], "dup_id": [],
         "undefined_acronym": [], "vague": [], "no_unit": [], "unused_glossary": []}
reqs: dict[str, str] = {}
counter = {"FR": 0, "NFR": 0}
all_ids: list[str] = []
anchors: list[str] = []


def new_id(kind: str) -> str:
    counter[kind] += 1
    rid = f"{kind}-{counter[kind]:04d}"
    all_ids.append(rid)
    return rid


def slug(text: str) -> str:
    import unicodedata
    t = unicodedata.normalize("NFKD", text.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return "-".join("".join(c if c.isalnum() else " " for c in t).split())


combos = [(a, o) for a in ACCIONES for o in OBJETOS]
rng.shuffle(combos)
combo_iter = iter(combos)
used_glossary: set[str] = set()


def base_fr_text() -> tuple[str, tuple[str, str, str, str]]:
    accion, objeto = next(combo_iter)
    actor = rng.choice(ACTORES)
    cond = rng.choice(CONDICIONES)
    text = f"El sistema DEBE permitir que el {actor} pueda {accion} {objeto}{cond}."
    return text, (actor, accion, objeto, cond)


def paraphrase(parts: tuple[str, str, str, str]) -> str:
    actor, accion, objeto, cond = parts
    verbo = rng.choice(PARAFRASIS.get(accion, [accion]))
    forms = [
        f"El {actor} DEBE poder {verbo} {objeto}{cond} en el sistema.",
        f"Se DEBE habilitar al {actor} para {verbo} {objeto}{cond}.",
        f"El sistema DEBE dar al {actor} la opción de {verbo} {objeto}{cond}.",
    ]
    return rng.choice(forms)


def negate(parts: tuple[str, str, str, str]) -> str:
    actor, accion, objeto, cond = parts
    forms = [
        f"El sistema NO DEBE permitir que el {actor} pueda {accion} {objeto}{cond}.",
        f"El {actor} NO DEBE poder {accion} {objeto}{cond}.",
    ]
    return rng.choice(forms)


pending_inject: list[tuple[int, str, str, str]] = []
nfr_keys: set[str] = set()
fr_pool: list[tuple[str, tuple[str, str, str, str]]] = []
qty_pool: list[tuple[str, int, str]] = []

n_mod = len(MODULOS)
plan = {
    "exact_dup": 30, "near_dup": 40, "polarity": 20, "numeric": 20, "semantic": len(SEMANTICAS),
    "broken_ref": 25, "dup_id": 10, "undefined_acronym": 15, "vague": 60, "no_unit": 15,
}
FR_PER_MOD = 48
inject_slots = {k: sorted(rng.sample(range(n_mod * FR_PER_MOD), v)) for k, v in plan.items()}

lines += ["# Especificación funcional: tienda en línea con logística propia (corpus sintético)", "",
          "> Documento generado para pruebas. Ningún dato es real.", "", "## Glosario", ""]
gloss_terms = list(GLOSARIO.items()) + [("Punto de recogida", "Término definido que nadie usa."),
                                         ("Canal alterno", "Término definido que nadie usa.")]
for term, defin in gloss_terms:
    lines.append(f"- **{term}**: {defin}")
truth["unused_glossary"] = ["Punto de recogida", "Canal alterno"]
lines += ["", "## Acrónimos", ""]
for ac in ACRONIMOS_DEFINIDOS:
    lines.append(f"- **{ac}**: acrónimo definido.")
lines.append("")

slot = 0
semantic_queue = list(SEMANTICAS)
acr_queue = list(ACRONIMOS_SIN_DEFINIR)

for mi, mod in enumerate(MODULOS):
    title = f"Módulo {mi + 1}: {mod}"
    lines += [f"## {title}", ""]
    anchors.append(slug(title))
    lines += [f"Este módulo cubre las capacidades de {mod.lower()} para compradores y usuarios internos.",
              "Las reglas de negocio se detallan en los requisitos y criterios de aceptación siguientes.", ""]
    lines += ["### Contexto", ""]
    for _ in range(rng.randint(22, 26)):
        lines.append(f"El equipo de {mod.lower()} trabaja con {rng.choice(OBJETOS)} y {rng.choice(OBJETOS)} "
                     f"en el canal de {rng.choice(['portal web', 'app móvil', 'back office', 'bodega'])}.")
    lines.append("")
    lines += ["### Historias de usuario", ""]
    for _ in range(4):
        actor = rng.choice(ACTORES)
        lines.append(f"- Como {actor}, quiero gestionar {rng.choice(OBJETOS)} para cumplir con mis tareas diarias.")
    lines += ["", "### Requisitos funcionales", ""]
    for k in range(FR_PER_MOD):
        rid = new_id("FR")
        text, parts = base_fr_text()
        tag = None
        modified = False
        if slot in inject_slots["exact_dup"] and fr_pool:
            src_id, src_parts = fr_pool.pop(rng.randrange(len(fr_pool)))
            text = reqs[src_id]
            truth["exact_dup"].append([src_id, rid])
            tag = "exact"
        elif slot in inject_slots["near_dup"] and fr_pool:
            src_id, src_parts = fr_pool.pop(rng.randrange(len(fr_pool)))
            text = paraphrase(src_parts)
            truth["near_dup"].append([src_id, rid])
            tag = "near"
        elif slot in inject_slots["polarity"] and fr_pool:
            src_id, src_parts = fr_pool.pop(rng.randrange(len(fr_pool)))
            text = negate(src_parts)
            truth["contradiction"].append({"a": src_id, "b": rid, "type": "polaridad"})
            tag = "neg"
        elif slot in inject_slots["semantic"] and semantic_queue:
            a_text, b_text = semantic_queue.pop()
            a_id = rid
            reqs[a_id] = a_text
            lines.append(f"- **{a_id}**: {a_text}")
            rid = new_id("FR")
            text = b_text
            pending_inject.append((min(n_mod - 1, mi + rng.randint(1, 5)), rid, text, a_id))
            truth["contradiction"].append({"a": a_id, "b": rid, "type": "semantica"})
            slot += 1
            continue
        elif slot in inject_slots["vague"]:
            vague_phrase, cue = rng.choice(VAGOS)
            text = text[:-1] + f" {vague_phrase}."
            truth["vague"].append({"id": rid, "cue": cue})
            modified = True
        elif slot in inject_slots["undefined_acronym"] and acr_queue:
            ac = acr_queue.pop()
            text = text[:-1] + f" según el estándar {ac}."
            truth["undefined_acronym"].append({"id": rid, "acronym": ac})
            modified = True
        elif slot in inject_slots["broken_ref"]:
            bad = f"FR-{rng.randint(5000, 9999):04d}" if rng.random() < 0.6 else None
            if bad:
                text = text[:-1] + f" (ver {bad})."
                truth["broken_ref"].append({"id": rid, "ref": bad})
                modified = True
            else:
                text = text[:-1] + " (ver [la sección de cierres](#modulo-99-cierres))."
                truth["broken_ref"].append({"id": rid, "ref": "#modulo-99-cierres"})
                modified = True
        elif slot in inject_slots["dup_id"] and len(all_ids) > 5:
            counter["FR"] -= 1
            all_ids.pop()
            rid = rng.choice([x for x in all_ids if x.startswith("FR-")])
            truth["dup_id"].append(rid)
            tag = "dupid"
        elif rng.random() < 0.08 and len(all_ids) > 10:
            ref = rng.choice([x for x in all_ids[:-1] if x.startswith("FR-")])
            text = text[:-1] + f" (relacionado con {ref})."
            modified = True
        for term in GLOSARIO:
            if term.lower() in text.lower():
                used_glossary.add(term)
        if tag != "dupid":
            reqs[rid] = text
            if tag is None and not modified:
                fr_pool.append((rid, parts))
        lines.append(f"- **{rid}**: {text}")
        slot += 1
    for when, prid, ptext, _ in [p for p in pending_inject if p[0] == mi]:
        reqs[prid] = ptext
        lines.append(f"- **{prid}**: {ptext}")
    pending_inject = [p for p in pending_inject if p[0] != mi]
    lines += ["", "### Requisitos no funcionales", ""]
    for k in range(rng.randint(5, 8)):
        rid = new_id("NFR")
        for _ in range(200):
            tpl, unit, values = rng.choice(CANTIDADES)
            v = rng.choice(values)
            actor_q, obj_q = rng.choice(ACTORES), rng.choice(OBJETOS)
            qkey = tpl.format(a=actor_q, o=obj_q, v="#")
            if qkey not in nfr_keys:
                break
        nfr_keys.add(qkey)
        text = tpl.format(a=actor_q, o=obj_q, v=v)
        text = text[0].upper() + text[1:] + "."
        if qty_pool and rng.random() < 0.25 and len(truth["contradiction"]) < 80 and \
                sum(1 for c in truth["contradiction"] if c["type"] == "numerica") < plan["numeric"]:
            src_id, src_v, src_tpl = qty_pool.pop(rng.randrange(len(qty_pool)))
            tpl_vals = next(c for c in CANTIDADES if c[0] == src_tpl)[2]
            other = rng.choice([x for x in tpl_vals if x != src_v])
            text = reqs[src_id].replace(str(src_v), str(other), 1)
            truth["contradiction"].append({"a": src_id, "b": rid, "type": "numerica"})
        elif rng.random() < 0.1 and len(truth["no_unit"]) < plan["no_unit"]:
            for _ in range(200):
                ukey = f"limite|{rng.choice(ACTORES)}|{rng.choice(OBJETOS)}"
                if ukey not in nfr_keys:
                    break
            nfr_keys.add(ukey)
            _, actor_u, obj_u = ukey.split("|")
            text = f"El límite de operaciones simultáneas por {actor_u} en {obj_u} DEBE ser {rng.choice([3, 5, 8, 10])}."
            truth["no_unit"].append(rid)
        else:
            qty_pool.append((rid, v, tpl))
        reqs[rid] = text
        lines.append(f"- **{rid}**: {text}")
    lines += ["", "### Criterios de aceptación", ""]
    fr_ids_mod = [x for x in all_ids if x.startswith("FR-")][-FR_PER_MOD:]
    for k in range(rng.randint(100, 110)):
        ref = rng.choice(fr_ids_mod)
        actor = rng.choice(ACTORES)
        lines.append(f"{k + 1}. Dado que el {actor} tiene permisos, cuando ejecuta la acción de {ref}, "
                     f"entonces el sistema registra el evento y muestra una confirmación.")
    lines += ["", "### Notas", ""]
    for k in range(rng.randint(36, 42)):
        other = rng.choice(anchors)
        lines.append(f"Para el detalle de dependencias consulte [la sección relacionada](#{other}) y el anexo técnico.")
    lines.append("")

truth["unused_glossary"] = sorted(set(truth["unused_glossary"]) | (set(GLOSARIO) - used_glossary))
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "spec-sintetica.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
(OUT / "truth.json").write_text(json.dumps(truth, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")
counts = {k: len(v) for k, v in truth.items() if isinstance(v, list)}
by_type = {}
for c in truth["contradiction"]:
    by_type[c["type"]] = by_type.get(c["type"], 0) + 1
print(json.dumps({"lines": len(lines), "requirements": len(reqs), "counts": counts, "contradictions": by_type},
                 ensure_ascii=False))
