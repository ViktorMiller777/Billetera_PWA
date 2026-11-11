"""Genera los íconos PNG de la PWA sin dependencias externas (solo stdlib)."""
import os
import struct
import zlib

BG = (15, 118, 110)       # #0f766e
FG = (255, 255, 255)


def png(path, size, safe_ratio, redondeado):
    """
    Dibuja un ícono de billetera simple.
    safe_ratio: porcentaje del lienzo usado por el dibujo (maskable usa ~0.6
    para quedar dentro de la zona segura).
    redondeado: esquinas redondeadas (íconos 'any'); maskable va a sangre completa.
    """
    s = size
    c = s / 2
    # Cuerpo de la billetera
    w = s * safe_ratio
    h = w * 0.72
    x0, x1 = c - w / 2, c + w / 2
    y0, y1 = c - h / 2, c + h / 2
    r_body = w * 0.10
    # Solapa / botón de cierre
    bx0, bx1 = x1 - w * 0.36, x1
    by0, by1 = c - h * 0.16, c + h * 0.16
    # Esquinas del fondo
    rad = s * 0.22

    def en_rect_redondeado(x, y, ax0, ay0, ax1, ay1, r):
        if x < ax0 or x > ax1 or y < ay0 or y > ay1:
            return False
        cx = min(max(x, ax0 + r), ax1 - r)
        cy = min(max(y, ay0 + r), ay1 - r)
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r

    filas = []
    for j in range(s):
        fila = bytearray([0])  # filtro 0
        for i in range(s):
            x, y = i + 0.5, j + 0.5
            if redondeado and not en_rect_redondeado(x, y, 0, 0, s, s, rad):
                fila += bytes((0, 0, 0, 0))
                continue
            color = BG
            if en_rect_redondeado(x, y, x0, y0, x1, y1, r_body):
                color = FG
                # Botón de cierre (hueco del color de fondo)
                if en_rect_redondeado(x, y, bx0, by0, bx1 + 1, by1, (by1 - by0) / 2):
                    color = BG
                # Círculo del botón
                if (x - (bx0 + (by1 - by0) / 2)) ** 2 + (y - c) ** 2 <= ((by1 - by0) * 0.22) ** 2:
                    color = FG
            fila += bytes((*color, 255))
        filas.append(bytes(fila))

    raw = b''.join(filas)

    def chunk(tipo, datos):
        cuerpo = tipo + datos
        return struct.pack('>I', len(datos)) + cuerpo + struct.pack('>I', zlib.crc32(cuerpo) & 0xffffffff)

    datos = (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', s, s, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )
    with open(path, 'wb') as f:
        f.write(datos)


os.makedirs('icons', exist_ok=True)
for tam in (192, 512):
    png(f'icons/icon-{tam}.png', tam, 0.62, True)            # purpose: any
    png(f'icons/icon-maskable-{tam}.png', tam, 0.46, False)  # purpose: maskable (zona segura)
print('Íconos generados en ./icons')
