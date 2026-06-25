from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import shutil
import os

app = FastAPI()

# 1. Obligamos a crear la carpeta EXACTAMENTE donde vive este script (main.py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "temp_videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"mensaje": "Servidor de IA activo y esperando videos"}

@app.post("/procesar-video/")
async def procesar_video(file: UploadFile = File(...)):
    try:
        # 2. Si iOS no envía el nombre del archivo, le asignamos uno a la fuerza
        nombre_archivo = file.filename if file.filename else "video_ios.mov"
        
        # 3. Construimos la ruta absoluta e inquebrantable
        file_location = os.path.join(UPLOAD_DIR, nombre_archivo)
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 4. Imprimimos un letrero gigante en la terminal para saber dónde quedó
        print("\n" + "="*50)
        print(f"✅ ÉXITO: Video guardado en -> {file_location}")
        print("="*50 + "\n")
        
        return JSONResponse(
            content={"mensaje": "Video recibido correctamente", "ruta": file_location},
            status_code=200
        )
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )