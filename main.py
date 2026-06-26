from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from tqdm import tqdm
import shutil
import os
import ffmpeg  # Importamos nuestro nuevo motor de video

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "temp_videos")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed_videos") # Nueva casa para los videos ligeros

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"mensaje": "Servidor de IA activo y esperando videos"}

@app.post("/procesar-video/")
async def procesar_video(file: UploadFile = File(...), inicio: int = Form(0)):
    try:
        nombre_archivo = file.filename if file.filename else "video_ios.mov"
        file_location = os.path.join(UPLOAD_DIR, nombre_archivo)
        
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print("\n" + "="*50)
        print(f"📥 1. Video recibido: {nombre_archivo} | ⏱️ Iniciar en el segundo: {inicio}")

        # ---------------------------------------------------------
        # 2. MAGIA DE FFMPEG: Ahora con punto de inicio dinámico
        # ---------------------------------------------------------
        nombre_procesado = "optimizado_" + nombre_archivo.replace(".mov", ".mp4")
        output_location = os.path.join(PROCESSED_DIR, nombre_procesado)
        
        (
            ffmpeg
            .input(file_location, ss=inicio)  # <--- AQUÍ INYECTAMOS TU COORDENADA
            .output(
                output_location, 
                t=3,                  # Sigue cortando exactamente 3 segundos
                vf='scale=720:-1',
                r=30,
                vcodec='libx264',
                acodec='aac'
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        print(f"✅ 3. Video listo en -> {output_location}")
        print("="*50 + "\n")
        
        return JSONResponse(
            content={"mensaje": "Éxito", "ruta_optimizado": output_location},
            status_code=200
        )
            
    except ffmpeg.Error as e:
        # Si FFmpeg se queja de algo, atrapamos su error exacto
        error_msg = e.stderr.decode('utf8') if e.stderr else str(e)
        print(f"❌ ERROR DE FFMPEG: {error_msg}")
        return JSONResponse(content={"error_ffmpeg": error_msg}, status_code=500)
        
    except Exception as e:
        print(f"❌ ERROR GENERAL: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)