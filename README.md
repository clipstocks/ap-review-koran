# A&P Daily Review · Koran

Dashboard de repaso diario del **Capítulo 1 de Anatomía y Fisiología** para Koran: 10 preguntas al día, diagramas, 2 intentos (1 intento en cierto o falso), explicaciones sencillas y resultados diarios y acumulados.

## Cómo funciona sin gastar tokens
- **GitHub Pages** (gratis) publica el dashboard como un enlace normal. Koran no necesita cuenta.
- **Google Sheets** (gratis) guarda cada contestación. Tú la ves en la app de Google Sheets en tu teléfono:
  - **Answers:** cada pregunta, 1er intento, 2do intento, contestación correcta y puntos.
  - **Daily summary:** puntuación de cada día.
  - **Totals:** acumulado (días completados, promedio, mejor puntuación).
- **Correos automáticos** (opcional): recordatorio a Koran a las 7 AM con el enlace y resumen para ti a las 8 PM.

Solo se gastan tokens al montarlo y al añadir capítulos nuevos.

## Empezar con Claude Code
1. Descomprime esta carpeta en tu laptop, por ejemplo en `Documents\ap-review-koran`.
2. Abre la terminal en esa carpeta y escribe:
   ```
   claude
   ```
3. Dile a Claude Code: **"Lee CLAUDE.md y ayúdame a publicar el dashboard paso a paso."**

Claude Code ya tiene en `CLAUDE.md` todas tus reglas y la lista de pasos: GitHub Pages, Google Sheets, correos diarios y cómo ponerlo en el teléfono de Koran.

## Probarlo antes en la laptop
Doble clic en `index.html` (se abre en Chrome). Así los resultados se guardan solo en ese navegador.

## Archivos importantes
- `js/config.js` — nombre del estudiante, capítulo y enlace de Google Sheets
- `js/bank.js` — las 111 preguntas
- `apps-script/Code.gs` — el código que va en Google Sheets
- `docs/question-bank.pdf` — todas las preguntas con sus contestaciones

@clipAI
