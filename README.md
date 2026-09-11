# A&P Daily Review · Koran

Dashboard de repaso diario del **Capítulo 1 de Anatomía y Fisiología** para Koran: 10 preguntas al día, diagramas, 2 intentos (1 intento en cierto o falso), explicaciones sencillas y resultados diarios y acumulados.

## Las reglas
- **Una pregunta a la vez.** No puede brincarse ninguna ni adelantarse.
- **2 minutos por pregunta.** El reloj cubre los dos intentos. Si cierra la app **el reloj se detiene** y al volver sigue en la misma pregunta. Si se acaba el tiempo: 0 puntos, le enseña la contestación con la explicación, y ese concepto vuelve mañana.
- **Puntos:** bien al 1er intento = 1 punto · bien al 2do = ½ punto · mal las dos veces = 0. Cierto o falso tiene un solo intento.
- **Lo que falla vuelve mañana**, preguntado de otra forma y marcado *Review*.
- **Si saca 2 o menos de 10:** le sale la lista de conceptos **con su explicación para estudiar**, y a los **60 minutos** se le abre la opción de repetir la prueba con preguntas distintas. Esa repetición es práctica: **no cambia la nota del día**, que siempre es la del primer intento.

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
