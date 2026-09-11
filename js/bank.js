/* Question bank — A&P Chapter 1: Introduction to Anatomy & Physiology (Quiz Review Guide)
   mc/scn: correct option FIRST (shuffled on screen) · tf: a = true/false · multi: a = correct indices
   img (optional): "quad:RUQ" | "reg:epigastric" | "plane:sagittal" — drawn as a diagram above the question */
const TOPICS = {
  basics: "Anatomy & physiology",
  org: "Organization & homeostasis",
  position: "Position, directions & planes",
  cavities: "Body cavities & membranes",
  abdomen: "Abdominal regions & organs",
  clinical: "Clinical conditions & imaging"
};

const BANK = [
  // ───────── Anatomy & physiology ─────────
  { id: "anaphys", t: "basics", name: "Anatomy vs. physiology",
    ex: "Anatomy = STRUCTURE (what a body part is and where it is). Physiology = FUNCTION (how it works). Studying the shape of the heart is anatomy; studying how the heart pumps is physiology.",
    v: [
      { t: "mc", q: "Anatomy is the study of:", o: ["Body structure and the physical relationships between body parts", "How the body functions", "Only diseases of the body", "Only the cells of the body"] },
      { t: "tf", q: "Physiology is the study of how the body functions.", a: true },
      { t: "scn", q: "A student measures how fast the heart pumps blood during exercise. Is the student studying anatomy or physiology?", o: ["Physiology", "Anatomy", "Cytology", "Surface anatomy"] }
    ] },
  { id: "grossmicro", t: "basics", name: "Gross vs. microscopic anatomy",
    ex: "Gross (macroscopic) anatomy looks at things you can see with your eyes, like the heart or a bone. Microscopic anatomy looks at things too small to see without a microscope.",
    v: [
      { t: "mc", q: "Which area of anatomy examines structures visible to the naked eye?", o: ["Gross (macroscopic) anatomy", "Microscopic anatomy", "Cytology", "Histology"] },
      { t: "scn", q: "A scientist studies a thin slice of the stomach wall under a microscope. Which area of anatomy is this?", o: ["Microscopic anatomy", "Gross anatomy", "Surface anatomy", "Regional anatomy"] },
      { t: "tf", q: "Microscopic anatomy studies structures that are visible to the naked eye.", a: false }
    ] },
  { id: "cytohisto", t: "basics", name: "Cytology & histology",
    ex: "Cytology = the study of CELLS (think \"cyto\" = cell). Histology = the study of TISSUES, which are groups of cells working together.",
    v: [
      { t: "mc", q: "Histology is the study of:", o: ["Tissues", "Cells", "Organ systems", "Body regions"] },
      { t: "tf", q: "Cytology is the study of cells.", a: true },
      { t: "scn", q: "A lab looks at individual cells scraped from the inside of the cheek. Which field is this?", o: ["Cytology", "Histology", "Regional anatomy", "Systemic physiology"] }
    ] },
  { id: "areas1", t: "basics", name: "Surface, regional & systemic anatomy",
    ex: "Surface anatomy = outside form and markings. Regional anatomy = everything in one body AREA (like the head and neck). Systemic anatomy = one organ SYSTEM at a time (like the digestive system).",
    v: [
      { t: "mc", q: "Which area of anatomy studies general form and superficial markings?", o: ["Surface anatomy", "Regional anatomy", "Microscopic anatomy", "Developmental anatomy"] },
      { t: "scn", q: "A textbook chapter covers every structure in the head and neck together. Which area of anatomy is it using?", o: ["Regional anatomy", "Systemic anatomy", "Cytology", "Developmental anatomy"] },
      { t: "scn", q: "A class studies the whole digestive system, from mouth to rectum. Which area of anatomy is this?", o: ["Systemic anatomy", "Regional anatomy", "Surface anatomy", "Histology"] }
    ] },
  { id: "areas2", t: "basics", name: "Developmental & clinical anatomy",
    ex: "Developmental anatomy follows how the body's form changes from conception until physical maturity. Clinical (pathological) anatomy uses anatomy to diagnose and treat patients.",
    v: [
      { t: "mc", q: "Which area of anatomy studies changes in form from conception through physical maturity?", o: ["Developmental anatomy", "Clinical anatomy", "Surface anatomy", "Systemic anatomy"] },
      { t: "scn", q: "A doctor uses knowledge of anatomy to find the cause of a patient's pain and plan treatment. Which area is this?", o: ["Clinical (pathological) anatomy", "Developmental anatomy", "Cytology", "Surface anatomy"] }
    ] },
  { id: "physareas", t: "basics", name: "Areas of physiology",
    ex: "Cell physiology = chemical processes in and between cells. Special (organ) physiology = one specific organ. Systemic physiology = a whole organ system. Clinical (pathological) physiology = how disease affects organs or systems.",
    v: [
      { t: "mc", q: "Which area of physiology studies chemical processes within and between cells?", o: ["Cell physiology", "Systemic physiology", "Special (organ) physiology", "Clinical physiology"] },
      { t: "scn", q: "A researcher studies how diabetes damages the kidneys. Which area of physiology is this?", o: ["Clinical (pathological) physiology", "Cell physiology", "Special (organ) physiology", "Systemic physiology"] },
      { t: "tf", q: "Special (organ) physiology studies the functions of specific organs.", a: true }
    ] },

  // ───────── Organization & homeostasis ─────────
  { id: "levels", t: "org", name: "Levels of organization",
    ex: "From smallest to largest: Atoms → Molecules → Organelles → Cells → Tissues → Organs → Organ systems → Organism. Small pieces build bigger pieces, like letters → words → sentences → a story.",
    v: [
      { t: "mc", q: "Which list shows the levels of organization in the correct order, from smallest to largest?", o: ["Atoms → Molecules → Organelles → Cells → Tissues → Organs → Organ systems → Organism", "Cells → Atoms → Molecules → Tissues → Organelles → Organs → Organ systems → Organism", "Molecules → Atoms → Cells → Organelles → Organs → Tissues → Organism → Organ systems", "Atoms → Molecules → Cells → Organelles → Tissues → Organ systems → Organs → Organism"] },
      { t: "mc", q: "Which level comes right after TISSUES?", o: ["Organs", "Cells", "Organ systems", "Organelles"] },
      { t: "tf", q: "An organ is composed of tissues.", a: true }
    ] },
  { id: "atomcell", t: "org", name: "Atom vs. cell",
    ex: "The atom is the smallest stable unit of matter, but it is NOT alive. The cell is the smallest LIVING unit.",
    v: [
      { t: "mc", q: "What is the smallest LIVING unit of the body?", o: ["Cell", "Atom", "Molecule", "Organelle"] },
      { t: "tf", q: "The atom is the smallest living unit of the body.", a: false }
    ] },
  { id: "orgsys", t: "org", name: "Organ system",
    ex: "An organ system is a group of organs that work together for one shared job. Example: the heart, blood vessels, and blood work together to move blood around the body.",
    v: [
      { t: "mc", q: "An organ system is:", o: ["A group of organs with a unique collective function", "A group of similar cells", "The smallest living unit", "A single organ"] },
      { t: "scn", q: "The mouth, stomach, and intestines work together to break down food. This group is an example of a(n):", o: ["Organ system", "Tissue", "Organelle", "Molecule"] }
    ] },
  { id: "life", t: "org", name: "Characteristics of life",
    ex: "Living things have cells, metabolism, reproduction, response to the environment, and adaptation (evolution). The slides' memory trick is CHRMD: Cells, Homeostasis, Reproduction, Metabolism, DNA/Heredity.",
    v: [
      { t: "multi", q: "Select the characteristics of life listed in the review guide.", o: ["Cells", "Metabolism", "Reproduction", "Response to the environment", "Photosynthesis", "Living only in water"], a: [0, 1, 2, 3] },
      { t: "mc", q: "In the memory trick CHRMD, what does the M stand for?", o: ["Metabolism", "Movement", "Muscles", "Membranes"] },
      { t: "scn", q: "You touch a hot pan and pull your hand away. Which characteristic of life does this show?", o: ["Response to the environment", "Reproduction", "Adaptation over generations", "Heredity"] }
    ] },
  { id: "homeo", t: "org", name: "Homeostasis",
    ex: "Homeostasis means keeping the inside of your body relatively stable, even when things outside change. Example: sweating on a hot day keeps your body temperature near normal.",
    v: [
      { t: "mc", q: "Homeostasis is:", o: ["Maintenance of a relatively stable internal environment", "The production of new cells", "The study of tissues", "An increase in body size"] },
      { t: "scn", q: "On a hot day you start to sweat and your body temperature stays near normal. What is your body doing?", o: ["Maintaining homeostasis", "Using positive feedback", "Reproducing", "Changing its anatomy"] },
      { t: "tf", q: "Homeostasis means the internal environment changes wildly all the time.", a: false }
    ] },
  { id: "negfb", t: "org", name: "Negative feedback",
    ex: "In negative feedback, the body's response goes the OPPOSITE way of the change, bringing things back to normal. Examples: body temperature, blood pressure, blood glucose, and blood calcium.",
    v: [
      { t: "mc", q: "In negative feedback, the response:", o: ["Opposes/reduces the original stimulus", "Enhances/amplifies the original stimulus", "Has no effect on the stimulus", "Stops all body functions"] },
      { t: "scn", q: "After a meal your blood glucose rises; insulin is released and glucose drops back to normal. This is an example of:", o: ["Negative feedback", "Positive feedback", "Cardiac tamponade", "Developmental anatomy"] },
      { t: "tf", q: "Control of body temperature is an example of negative feedback.", a: true }
    ] },
  { id: "posfb", t: "org", name: "Positive feedback",
    ex: "In positive feedback, the response makes the change even BIGGER until an event is finished. Examples: childbirth (contractions get stronger), blood clotting, and lactation.",
    v: [
      { t: "mc", q: "In positive feedback, the response:", o: ["Enhances/amplifies the original stimulus", "Opposes/reduces the original stimulus", "Always restores the normal set point right away", "Only happens in plants"] },
      { t: "scn", q: "During childbirth, contractions trigger a hormone that makes the contractions even stronger. This is:", o: ["Positive feedback", "Negative feedback", "Homeostatic set point", "A sectional plane"] },
      { t: "multi", q: "Select the examples of POSITIVE feedback.", o: ["Childbirth", "Blood clotting", "Lactation", "Body temperature regulation", "Blood pressure regulation"], a: [0, 1, 2] }
    ] },
  { id: "regmech", t: "org", name: "Receptor → control center → effector",
    ex: "Receptor = senses a change. Control center = processes the information and sends instructions. Effector = carries out the instructions. Example: skin senses cold → brain decides → muscles shiver.",
    v: [
      { t: "mc", q: "What is the correct order of a homeostatic regulatory mechanism?", o: ["Receptor → Control center → Effector", "Effector → Receptor → Control center", "Control center → Effector → Receptor", "Receptor → Effector → Control center"] },
      { t: "scn", q: "Skin sensors detect cold, the brain processes it, and muscles start to shiver. In this example, the muscles are the:", o: ["Effector", "Receptor", "Control center", "Stimulus"] },
      { t: "tf", q: "The control center is the part that senses a change.", a: false }
    ] },

  // ───────── Position, directions & planes ─────────
  { id: "anatpos", t: "position", name: "Anatomical position",
    ex: "Anatomical position: standing up straight, facing forward, arms at the sides, palms facing FORWARD, feet slightly apart. Doctors use it so everyone describes the body the same way.",
    v: [
      { t: "mc", q: "Which describes the anatomical position?", o: ["Standing erect, facing forward, arms at the sides, palms forward, feet slightly apart", "Lying face down with arms over the head", "Standing with palms facing backward and feet crossed", "Sitting with arms folded"] },
      { t: "tf", q: "In anatomical position, the palms face backward.", a: false }
    ] },
  { id: "supineprone", t: "position", name: "Supine vs. prone",
    ex: "Supine = lying on your back, face UP (you could hold a bowl of soup: \"sup\"). Prone = lying on your belly, face DOWN.",
    v: [
      { t: "mc", q: "A patient lying on their back with the face upward is in the ___ position.", o: ["Supine", "Prone", "Anatomical", "Lateral"] },
      { t: "scn", q: "For an exam of the back, the patient lies on their belly with the face down. This position is:", o: ["Prone", "Supine", "Anatomical", "Superior"] },
      { t: "tf", q: "Prone means lying face down.", a: true }
    ] },
  { id: "supinf", t: "position", name: "Superior vs. inferior",
    ex: "Superior = toward the HEAD (higher). Inferior = toward the FEET (lower). The head is superior to the chest.",
    v: [
      { t: "mc", q: "The head is ___ to the chest.", o: ["Superior", "Inferior", "Distal", "Deep"] },
      { t: "tf", q: "Inferior means toward the feet.", a: true },
      { t: "scn", q: "The knee is closer to the feet than the hip is. The knee is ___ to the hip.", o: ["Inferior", "Superior", "Medial", "Superficial"] }
    ] },
  { id: "antpost", t: "position", name: "Anterior vs. posterior",
    ex: "Anterior (ventral) = toward the FRONT. Posterior (dorsal) = toward the BACK. The breastbone is anterior to the spine.",
    v: [
      { t: "mc", q: "The sternum (breastbone) is ___ to the spine.", o: ["Anterior (ventral)", "Posterior (dorsal)", "Lateral", "Proximal"] },
      { t: "tf", q: "Dorsal means the same as posterior.", a: true },
      { t: "scn", q: "The shoulder blades are on the back of the body and the belly button is on the front. The shoulder blades are ___ to the belly button.", o: ["Posterior (dorsal)", "Anterior (ventral)", "Distal", "Medial"] }
    ] },
  { id: "medlat", t: "position", name: "Medial vs. lateral",
    ex: "Medial = toward the MIDLINE (an imaginary line down the middle of the body). Lateral = AWAY from the midline, toward the sides.",
    v: [
      { t: "mc", q: "The nose is ___ to the eyes.", o: ["Medial", "Lateral", "Distal", "Superficial"] },
      { t: "scn", q: "The ears are on the sides of the head, far from the midline. The ears are ___ to the nose.", o: ["Lateral", "Medial", "Proximal", "Deep"] },
      { t: "tf", q: "Lateral means toward the midline of the body.", a: false }
    ] },
  { id: "proxdist", t: "position", name: "Proximal vs. distal",
    ex: "Proximal = CLOSER to where a limb attaches to the body. Distal = FARTHER from that point. The elbow is proximal to the wrist; the fingers are distal to the elbow.",
    v: [
      { t: "mc", q: "The elbow is ___ to the wrist.", o: ["Proximal", "Distal", "Lateral", "Inferior"] },
      { t: "scn", q: "The fingers are farther than the elbow from where the arm attaches to the body. The fingers are ___ to the elbow.", o: ["Distal", "Proximal", "Medial", "Superior"] }
    ] },
  { id: "supdeep", t: "position", name: "Superficial vs. deep",
    ex: "Superficial = closer to the body SURFACE. Deep = farther INSIDE, away from the surface. The skin is superficial to the muscles.",
    v: [
      { t: "mc", q: "The skin is ___ to the muscles.", o: ["Superficial", "Deep", "Proximal", "Caudal"] },
      { t: "tf", q: "Deep means farther from the surface of the body.", a: true }
    ] },
  { id: "cranialcaudal", t: "position", name: "Cranial vs. caudal",
    ex: "Cranial = toward the HEAD (cranium = skull). Caudal = toward the lower end or TAIL (\"cauda\" means tail).",
    v: [
      { t: "mc", q: "Caudal means:", o: ["Toward the lower end or tail", "Toward the head", "Toward the front", "Toward the midline"] },
      { t: "tf", q: "Cranial means toward the head.", a: true }
    ] },
  { id: "sagittal", t: "position", name: "Sagittal plane",
    ex: "A sagittal plane cuts the body into LEFT and RIGHT portions. Memory trick: Sagittal = Sides.",
    v: [
      { t: "mc", img: "plane:sagittal", q: "Which plane is shown by the dashed line?", o: ["Sagittal", "Coronal (frontal)", "Transverse (horizontal)", "Diagonal"] },
      { t: "mc", q: "Which plane divides the body into left and right portions?", o: ["Sagittal", "Coronal (frontal)", "Transverse (horizontal)", "Superficial"] }
    ] },
  { id: "coronal", t: "position", name: "Coronal (frontal) plane",
    ex: "A coronal (frontal) plane cuts the body into a FRONT (anterior) piece and a BACK (posterior) piece. Memory trick: Coronal = front/back.",
    v: [
      { t: "mc", img: "plane:coronal", q: "In this side view, which plane is shown by the dashed line?", o: ["Coronal (frontal)", "Sagittal", "Transverse (horizontal)", "Diagonal"] },
      { t: "scn", q: "A cut separates the face and chest from the back of the body. Which plane made this cut?", o: ["Coronal (frontal)", "Sagittal", "Transverse (horizontal)", "Midline"] }
    ] },
  { id: "transverse", t: "position", name: "Transverse (horizontal) plane",
    ex: "A transverse (horizontal) plane cuts the body into a TOP (superior) piece and a BOTTOM (inferior) piece. Memory trick: Transverse = top/bottom, like slicing bread.",
    v: [
      { t: "mc", img: "plane:transverse", q: "Which plane is shown by the dashed line?", o: ["Transverse (horizontal)", "Sagittal", "Coronal (frontal)", "Vertical"] },
      { t: "scn", q: "A CT scan shows \"slices\" that separate the body into upper and lower parts. Which plane are these slices in?", o: ["Transverse (horizontal)", "Sagittal", "Coronal (frontal)", "Oblique"] }
    ] },

  // ───────── Body cavities & membranes ─────────
  { id: "ventral", t: "cavities", name: "Ventral body cavity",
    ex: "The ventral (front) cavity has two parts: the thoracic cavity (chest) and the abdominopelvic cavity (belly and pelvis). The diaphragm muscle separates them.",
    v: [
      { t: "mc", q: "The ventral body cavity includes the:", o: ["Thoracic and abdominopelvic cavities", "Cranial and spinal cavities", "Cranial cavity only", "Pericardial and cranial cavities"] },
      { t: "tf", q: "The diaphragm separates the thoracic cavity from the abdominopelvic cavity.", a: true },
      { t: "scn", q: "A wound tears through the diaphragm. Which two cavities are no longer separated?", o: ["Thoracic and abdominopelvic", "Cranial and spinal", "Pericardial and pleural", "Spinal and abdominopelvic"] }
    ] },
  { id: "dorsal", t: "cavities", name: "Dorsal body cavity",
    ex: "The dorsal (back) cavity has the cranial cavity, which holds the BRAIN, and the spinal cavity, which holds the SPINAL CORD.",
    v: [
      { t: "mc", q: "The dorsal body cavity contains the:", o: ["Cranial cavity (brain) and spinal cavity (spinal cord)", "Heart and lungs", "Stomach and liver", "Kidneys and bladder"] },
      { t: "tf", q: "The brain is located in the ventral body cavity.", a: false }
    ] },
  { id: "thoracic", t: "cavities", name: "Thoracic cavity",
    ex: "The thoracic cavity (chest) holds the heart and lungs. The heart sits in the PERICARDIAL cavity; each lung sits in its own PLEURAL cavity.",
    v: [
      { t: "mc", q: "The heart sits in the ___ cavity, and each lung sits in a ___ cavity.", o: ["pericardial; pleural", "pleural; pericardial", "cranial; spinal", "abdominal; pelvic"] },
      { t: "tf", q: "The thoracic cavity contains the heart and lungs.", a: true }
    ] },
  { id: "mediastinum", t: "cavities", name: "Mediastinum",
    ex: "The mediastinum is the central compartment of the chest, between the lungs. It holds the heart, great vessels, esophagus, trachea, phrenic and cardiac nerves, thoracic duct, thymus, and lymph nodes. The lungs are NOT in it.",
    v: [
      { t: "mc", q: "The mediastinum is:", o: ["The central compartment of the thoracic cavity", "The space around each lung", "The lining of the abdominopelvic cavity", "Part of the dorsal body cavity"] },
      { t: "multi", q: "Select the structures found in the mediastinum.", o: ["Heart", "Esophagus", "Trachea", "Thymus", "Lungs", "Kidneys"], a: [0, 1, 2, 3] },
      { t: "tf", q: "The lungs are located inside the mediastinum.", a: false }
    ] },
  { id: "serous", t: "cavities", name: "Serous membranes",
    ex: "Serous membranes are thin linings: PERICARDIUM = heart, PLEURAE = lungs, PERITONEUM = abdominopelvic cavity. Their serous fluid lets organs move and expand without friction.",
    v: [
      { t: "mc", q: "Which serous membrane is associated with the lungs?", o: ["Pleurae", "Pericardium", "Peritoneum", "Mediastinum"] },
      { t: "mc", q: "Which serous membrane is associated with the abdominopelvic cavity?", o: ["Peritoneum", "Pleurae", "Pericardium", "Diaphragm"] },
      { t: "scn", q: "Each time the heart beats, it rubs against the tissue around it. What reduces this friction?", o: ["Serous fluid", "Blood in the dural sinuses", "Air in the lungs", "The diaphragm"] }
    ] },
  { id: "parvisc", t: "cavities", name: "Parietal vs. visceral layers",
    ex: "Picture pushing your fist into a balloon: the layer touching your fist is VISCERAL (covers the organ); the outer layer is PARIETAL (lines the cavity or body wall).",
    v: [
      { t: "mc", q: "The visceral layer of a serous membrane:", o: ["Lines/covers the internal organ", "Lines the cavity/body wall", "Is filled with air", "Is part of the skin"] },
      { t: "scn", q: "The layer of pleura attached directly to the surface of the lung is the:", o: ["Visceral pleura", "Parietal pleura", "Pericardium", "Peritoneum"] },
      { t: "tf", q: "The parietal layer lines the cavity or body wall.", a: true }
    ] },

  // ───────── Abdominal regions & organs ─────────
  { id: "quadrants", t: "abdomen", name: "Abdominal quadrants",
    ex: "The abdomen is split into 4 quadrants by a vertical and a horizontal line through the belly button: RUQ, LUQ, RLQ, LLQ. Right and left are always the PATIENT's right and left.",
    v: [
      { t: "mc", img: "quad:RUQ", q: "Which quadrant is highlighted? (R = patient's right)", o: ["RUQ — Right Upper Quadrant", "LUQ — Left Upper Quadrant", "RLQ — Right Lower Quadrant", "LLQ — Left Lower Quadrant"] },
      { t: "mc", img: "quad:LLQ", q: "Which quadrant is highlighted? (R = patient's right)", o: ["LLQ — Left Lower Quadrant", "RLQ — Right Lower Quadrant", "LUQ — Left Upper Quadrant", "RUQ — Right Upper Quadrant"] },
      { t: "mc", q: "What does LUQ stand for?", o: ["Left Upper Quadrant", "Lower Upper Quadrant", "Lateral Upper Quadrant", "Left Under Quadrant"] }
    ] },
  { id: "regcenter", t: "abdomen", name: "Epigastric, umbilical & hypogastric regions",
    ex: "The middle column of the 9 regions, from top to bottom: EPIGASTRIC (above the stomach area), UMBILICAL (around the belly button), HYPOGASTRIC (below the belly button).",
    v: [
      { t: "mc", img: "reg:epigastric", q: "Which of the 9 abdominal regions is highlighted?", o: ["Epigastric", "Umbilical", "Hypogastric", "Right hypochondriac"] },
      { t: "mc", img: "reg:hypogastric", q: "Which of the 9 abdominal regions is highlighted?", o: ["Hypogastric", "Umbilical", "Epigastric", "Left iliac (inguinal)"] },
      { t: "mc", q: "Which region is in the CENTER of the 9 abdominal regions?", o: ["Umbilical", "Epigastric", "Hypogastric", "Left lumbar"] }
    ] },
  { id: "regsides", t: "abdomen", name: "Hypochondriac, lumbar & iliac regions",
    ex: "The side columns, from top to bottom: HYPOCHONDRIAC (under the ribs), LUMBAR (beside the belly button), ILIAC/INGUINAL (near the hips and groin). Each has a right and a left.",
    v: [
      { t: "mc", img: "reg:rhypochondriac", q: "Which of the 9 abdominal regions is highlighted? (R = patient's right)", o: ["Right hypochondriac", "Left hypochondriac", "Epigastric", "Right lumbar"] },
      { t: "mc", img: "reg:llumbar", q: "Which of the 9 abdominal regions is highlighted? (R = patient's right)", o: ["Left lumbar", "Right lumbar", "Umbilical", "Left iliac (inguinal)"] },
      { t: "mc", q: "Which regions make up the BOTTOM row of the 9 abdominal regions?", o: ["Right iliac, hypogastric, left iliac", "Right lumbar, umbilical, left lumbar", "Right hypochondriac, epigastric, left hypochondriac", "Right iliac, umbilical, left lumbar"] }
    ] },
  { id: "retro", t: "abdomen", name: "Retroperitoneal organs (SAD PUCKER)",
    ex: "Retroperitoneal = BEHIND the peritoneum. Remember SAD PUCKER: Suprarenal glands, Abdominal aorta, Duodenum, Pancreas, Ureters, Colon (ascending/descending), Kidneys, Esophagus (inferior part), Rectum.",
    v: [
      { t: "mc", q: "What does retroperitoneal mean?", o: ["Situated behind the peritoneum", "Inside the pericardium", "Above the diaphragm", "Inside the cranial cavity"] },
      { t: "multi", q: "Select the retroperitoneal organs (SAD PUCKER).", o: ["Kidneys", "Pancreas", "Abdominal aorta", "Ureters", "Brain", "Lungs"], a: [0, 1, 2, 3] },
      { t: "mc", q: "In the memory trick SAD PUCKER, what does the K stand for?", o: ["Kidneys", "Knees", "Keratin", "Kinetic energy"] }
    ] },

  // ───────── Clinical conditions & imaging ─────────
  { id: "pleural", t: "clinical", name: "Pleuritis & pleural effusion",
    ex: "Pleuritis (pleurisy) = the pleurae around the lungs are INFLAMED. Pleural effusion = extra FLUID builds up in the spaces around the lungs.",
    v: [
      { t: "mc", q: "Pleuritis (pleurisy) is:", o: ["Inflammation of the pleurae", "Fluid in the peritoneal cavity", "Compression of the heart", "Inflammation of the peritoneum"] },
      { t: "scn", q: "A chest X-ray shows abnormal fluid collecting in the spaces around the lungs. This condition is:", o: ["Pleural effusion", "Ascites", "Pericarditis", "Peritonitis"] }
    ] },
  { id: "cardiac", t: "clinical", name: "Pericarditis & cardiac tamponade",
    ex: "Pericarditis = the pericardium (sac around the heart) is inflamed. Cardiac tamponade = blood or fluid fills the pericardial sac and SQUEEZES the heart so it can't pump well.",
    v: [
      { t: "mc", q: "Cardiac tamponade is:", o: ["Compression of the heart from blood or fluid in the pericardial sac", "Inflammation of the pleurae", "Fluid buildup in the peritoneal cavity", "A tear in the diaphragm"] },
      { t: "tf", q: "Pericarditis is inflammation of the pericardium.", a: true },
      { t: "scn", q: "After a car accident, blood collects around the heart inside its sac and squeezes it. This is:", o: ["Cardiac tamponade", "Pleurisy", "Ascites", "Peritonitis"] }
    ] },
  { id: "peritoneal", t: "clinical", name: "Peritonitis & ascites",
    ex: "Peritonitis = the peritoneum (lining of the abdominopelvic cavity) is INFLAMED. Ascites = extra FLUID builds up in the peritoneal cavity, making the belly swell.",
    v: [
      { t: "mc", q: "Ascites is:", o: ["Abnormal accumulation of fluid in the peritoneal cavity", "Inflammation of the peritoneum", "Fluid around the lungs", "Inflammation of the heart sac"] },
      { t: "tf", q: "Peritonitis is inflammation of the peritoneum.", a: true }
    ] },
  { id: "xrayct", t: "clinical", name: "X-ray & CT",
    ex: "X-ray uses high-energy radiation that passes through the body; it is great for bones. CT combines many X-ray images from different angles to make cross-section \"slices.\"",
    v: [
      { t: "mc", q: "Which imaging method combines X-ray images from different angles to create cross-sectional images?", o: ["CT", "MRI", "Ultrasound", "PET"] },
      { t: "scn", q: "A child falls and the doctor wants a quick look at a possible broken arm bone. Which imaging is most useful for bone?", o: ["X-ray", "PET", "Angiography", "Nuclear scan"] }
    ] },
  { id: "mri", t: "clinical", name: "MRI",
    ex: "MRI uses pulses of RADIO WAVES (with a strong magnet) and gives very detailed pictures of soft tissue. It is the imaging method in this chapter that uses radio waves.",
    v: [
      { t: "mc", q: "Which imaging procedure uses radio waves?", o: ["MRI", "CT", "X-ray", "Angiography"] },
      { t: "scn", q: "A doctor needs a very detailed image of the soft tissues inside a knee. Which imaging method fits best?", o: ["MRI", "X-ray", "Nuclear scan", "Angiography"] },
      { t: "tf", q: "MRI uses high-energy X-ray radiation.", a: false }
    ] },
  { id: "ultrasound", t: "clinical", name: "Ultrasound",
    ex: "Ultrasound sends high-frequency SOUND waves into the body and uses the echoes to create images, like a bat using echoes to \"see.\"",
    v: [
      { t: "mc", q: "Ultrasound creates images using:", o: ["High-frequency sound waves and echoes", "Pulses of radio waves", "A radioactive tracer", "X-rays from different angles"] },
      { t: "scn", q: "A pregnant patient has an imaging test that bounces sound waves off the baby to make a picture. Which test is this?", o: ["Ultrasound", "CT", "PET", "X-ray"] }
    ] },
  { id: "nucpet", t: "clinical", name: "Nuclear scan & PET",
    ex: "A nuclear scan uses a radioactive TRACER (radiopharmaceutical). A PET scan also uses a tracer and shows how active tissues are (their metabolism).",
    v: [
      { t: "mc", q: "A PET scan assesses:", o: ["Metabolic/physiological activity using a tracer", "Bone structure using sound waves", "Blood vessels using a catheter only", "Soft tissue using radio waves"] },
      { t: "tf", q: "A nuclear scan uses a radioactive tracer.", a: true }
    ] },
  { id: "angio", t: "clinical", name: "Angiography",
    ex: "Angiography is used to see BLOOD VESSELS. It may use a contrast dye and a thin tube (catheter) placed in a vessel.",
    v: [
      { t: "mc", q: "Which procedure is used to visualize blood vessels and may involve contrast dye and catheterization?", o: ["Angiography", "Ultrasound", "MRI", "PET"] },
      { t: "scn", q: "A doctor threads a thin catheter into an artery and injects dye to look for a blocked vessel. This procedure is:", o: ["Angiography", "Nuclear scan", "Ultrasound", "X-ray of the bone"] }
    ] }
];

/* ───────── diagrams (dark-theme colors via CSS classes) ───────── */
function drawImg(spec) {
  const [kind, key] = spec.split(":");
  if (kind === "quad") {
    const cells = { RUQ: [0, 0], LUQ: [1, 0], RLQ: [0, 1], LLQ: [1, 1] };
    let s = `<svg class="dia" viewBox="0 0 240 230" role="img" aria-label="Abdomen divided into four quadrants">`;
    s += `<rect class="dia-body" x="30" y="20" width="180" height="180" rx="40"/>`;
    const [cx, cy] = cells[key];
    s += `<rect class="dia-hi" x="${30 + cx * 90}" y="${20 + cy * 90}" width="90" height="90" rx="${0}" clip-path="url(#qclip)"/>`;
    s += `<clipPath id="qclip"><rect x="30" y="20" width="180" height="180" rx="40"/></clipPath>`;
    s += `<line class="dia-line" x1="120" y1="20" x2="120" y2="200"/><line class="dia-line" x1="30" y1="110" x2="210" y2="110"/>`;
    s += `<circle class="dia-navel" cx="120" cy="110" r="4"/>`;
    s += `<text class="dia-lbl" x="12" y="115">R</text><text class="dia-lbl" x="220" y="115">L</text>`;
    s += `<text class="dia-cap" x="120" y="222">patient facing you</text></svg>`;
    return s;
  }
  if (kind === "reg") {
    const names = [["rhypochondriac", "epigastric", "lhypochondriac"], ["rlumbar", "umbilical", "llumbar"], ["riliac", "hypogastric", "liliac"]];
    let s = `<svg class="dia" viewBox="0 0 240 230" role="img" aria-label="Abdomen divided into nine regions">`;
    s += `<clipPath id="rclip"><rect x="30" y="20" width="180" height="180" rx="40"/></clipPath>`;
    s += `<rect class="dia-body" x="30" y="20" width="180" height="180" rx="40"/>`;
    names.forEach((row, r) => row.forEach((n, c) => {
      if (n === key) s += `<rect class="dia-hi" x="${30 + c * 60}" y="${20 + r * 60}" width="60" height="60" clip-path="url(#rclip)"/>`;
    }));
    s += `<line class="dia-line" x1="90" y1="20" x2="90" y2="200"/><line class="dia-line" x1="150" y1="20" x2="150" y2="200"/>`;
    s += `<line class="dia-line" x1="30" y1="80" x2="210" y2="80"/><line class="dia-line" x1="30" y1="140" x2="210" y2="140"/>`;
    s += `<circle class="dia-navel" cx="120" cy="110" r="4"/>`;
    s += `<text class="dia-lbl" x="12" y="115">R</text><text class="dia-lbl" x="220" y="115">L</text>`;
    s += `<text class="dia-cap" x="120" y="222">patient facing you</text></svg>`;
    return s;
  }
  if (kind === "plane") {
    const front = `<circle class="dia-body" cx="120" cy="38" r="20"/>
      <rect class="dia-body" x="92" y="62" width="56" height="78" rx="14"/>
      <rect class="dia-body" x="70" y="66" width="18" height="70" rx="9"/><rect class="dia-body" x="152" y="66" width="18" height="70" rx="9"/>
      <rect class="dia-body" x="96" y="138" width="22" height="72" rx="10"/><rect class="dia-body" x="122" y="138" width="22" height="72" rx="10"/>`;
    const side = `<circle class="dia-body" cx="120" cy="38" r="20"/><circle class="dia-body" cx="140" cy="40" r="5"/>
      <rect class="dia-body" x="100" y="62" width="42" height="78" rx="14"/>
      <rect class="dia-body" x="112" y="66" width="16" height="70" rx="8"/>
      <rect class="dia-body" x="106" y="138" width="26" height="72" rx="10"/><rect class="dia-body" x="120" y="202" width="26" height="10" rx="5"/>`;
    let s = `<svg class="dia" viewBox="0 0 240 230" role="img" aria-label="Human figure with a dashed plane line">`;
    if (key === "sagittal") s += front + `<line class="dia-cut" x1="120" y1="6" x2="120" y2="216"/><text class="dia-cap" x="120" y="228">front view</text>`;
    if (key === "transverse") s += front + `<line class="dia-cut" x1="40" y1="104" x2="200" y2="104"/><text class="dia-cap" x="120" y="228">front view</text>`;
    if (key === "coronal") s += side + `<text class="dia-lbl2" x="170" y="100">front</text><text class="dia-lbl2" x="42" y="100">back</text><line class="dia-cut" x1="121" y1="6" x2="121" y2="216"/><text class="dia-cap" x="120" y="228">side view</text>`;
    return s + `</svg>`;
  }
  return "";
}
