import fs from "fs";
import path from "path";
import ort from "onnxruntime-web";

let cachedSession = null;
let isInitializing = false;
let classesCache = null;

const MODEL_PATH = path.resolve(process.cwd(), "public/models/grocery_model/grocery_model.onnx");
const CLASSES_PATH = path.resolve(process.cwd(), "public/models/grocery_model/classes.txt");

export function getModelClasses() {
  if (classesCache) return classesCache;
  try {
    if (fs.existsSync(CLASSES_PATH)) {
      const content = fs.readFileSync(CLASSES_PATH, "utf8");
      classesCache = content.split("\n").map((c) => c.trim()).filter(Boolean);
      return classesCache;
    }
  } catch (err) {
    console.warn("[GroceryModelService] Failed to load classes.txt:", err.message);
  }
  return [];
}

export async function getModelSession() {
  if (cachedSession) return cachedSession;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return cachedSession;
  }

  isInitializing = true;
  try {
    if (!fs.existsSync(MODEL_PATH)) {
      throw new Error(`Model file not found at ${MODEL_PATH}`);
    }
    const modelBuffer = fs.readFileSync(MODEL_PATH);
    cachedSession = await ort.InferenceSession.create(new Uint8Array(modelBuffer), {
      executionProviders: ["wasm"],
    });
    console.info("[GroceryModelService] Trained ONNX grocery model loaded successfully into server memory!");
    return cachedSession;
  } catch (err) {
    console.error("[GroceryModelService] Error initializing ONNX session:", err);
    throw err;
  } finally {
    isInitializing = false;
  }
}

export async function getModelStatus() {
  const modelExists = fs.existsSync(MODEL_PATH);
  const classes = getModelClasses();
  let sessionReady = Boolean(cachedSession);
  let sessionError = null;

  if (modelExists && !sessionReady) {
    try {
      await getModelSession();
      sessionReady = true;
    } catch (err) {
      sessionError = err.message;
    }
  }

  const stat = modelExists ? fs.statSync(MODEL_PATH) : null;

  return {
    success: true,
    modelName: "GroceryStore MobileNetV2 (81 Fine-Grained Classes)",
    framework: "ONNX Runtime",
    status: sessionReady ? "ready" : (modelExists ? "file_present" : "missing"),
    isLoadedInMemory: sessionReady,
    totalClasses: classes.length,
    sampleClasses: classes.slice(0, 10),
    fileSizeMB: stat ? +(stat.size / (1024 * 1024)).toFixed(2) : 0,
    modelFilePath: "/models/grocery_model/grocery_model.onnx",
    classesFilePath: "/models/grocery_model/classes.txt",
    lastChecked: new Date().toISOString(),
    error: sessionError,
  };
}

/**
 * Executes inference on input float32 array [1, 3, 224, 224]
 */
export async function classifyTensor(float32Array) {
  const session = await getModelSession();
  const classes = getModelClasses();

  const tensor = new ort.Tensor("float32", float32Array, [1, 3, 224, 224]);
  const results = await session.run({ input: tensor });
  const output = results.output || results[Object.keys(results)[0]];
  const data = output.data;

  let maxVal = -1e9;
  for (let i = 0; i < data.length; i++) {
    if (data[i] > maxVal) maxVal = data[i];
  }
  let sumExp = 0;
  const exps = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    exps[i] = Math.exp(data[i] - maxVal);
    sumExp += exps[i];
  }

  const sortedIndices = Array.from({ length: data.length }, (_, i) => i)
    .sort((a, b) => exps[b] - exps[a]);

  const topIdx = sortedIndices[0];
  const topProb = sumExp > 0 ? exps[topIdx] / sumExp : 0.95;
  const topClass = classes[topIdx] || `Class_${topIdx}`;

  const alternatives = sortedIndices.slice(1, 5).map((idx) => ({
    classIndex: idx,
    className: classes[idx] || `Class_${idx}`,
    confidence: sumExp > 0 ? +(exps[idx] / sumExp).toFixed(4) : 0.05,
  }));

  return {
    classIndex: topIdx,
    className: topClass,
    confidence: +topProb.toFixed(4),
    alternatives,
  };
}
