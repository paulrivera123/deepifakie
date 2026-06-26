import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';

export default function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  
  const [segundos, setSegundos] = useState(0);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!cameraPermission) {
    return <View style={styles.container} />;
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.textMessage}>Se requiere acceso a la cámara para el filtro</Text>
        <Button title="Otorgar Permiso" onPress={requestCameraPermission} color="#555" />
      </View>
    );
  }

  const iniciarTemporizador = () => {
    setSegundos(0);
    timerRef.current = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);
  };

  const detenerTemporizador = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

const enviarVideoAlServidor = async (videoUri: string) => {
    try {
      console.log("Subiendo video nativamente desde:", videoUri);
      const urlServidor = 'http://192.168.1.161:8000/procesar-video/'; // MANTÉN TU IP REAL AQUÍ
      
      // Definiendo el segundo exacto donde queremos que la IA empiece a trabajar
      const segundoDeInicio = "4"; 

      const response = await FileSystem.uploadAsync(urlServidor, videoUri, {
        httpMethod: 'POST',
        uploadType: 1 as any,
        fieldName: 'file',
        mimeType: videoUri.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4',
        // ESTA ES LA LÍNEA NUEVA: El "papelito" con las instrucciones
        parameters: {
          inicio: segundoDeInicio 
        }
      });
      console.log("¡Respuesta del servidor!", response.body);
    } catch (error) {
      console.error("Error al subir el archivo:", error);
    }
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      iniciarTemporizador();
      
      try {
        const videoRecordPromise = cameraRef.current.recordAsync({
          maxDuration: 10, 
        });
        
        const data = await videoRecordPromise;
        
        setIsRecording(false);
        detenerTemporizador();
        
        if (data?.uri) {
            await enviarVideoAlServidor(data.uri);
        }
      } catch (error) {
        console.error("Error al grabar:", error);
        setIsRecording(false);
        detenerTemporizador();
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const formatearTiempo = (segs: number) => {
    const m = Math.floor(segs / 60).toString().padStart(2, '0');
    const s = (segs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      {/* 1. La cámara ya no tiene "children". Se cierra a sí misma con /> */}
      <CameraView 
        style={styles.camera} 
        facing={facing}
        mode="video"
        mute={true}
        ref={cameraRef}
      />

      {/* 2. Capa superior flotante (Overlay) con posición absoluta */}
      <View style={styles.overlay}>
        
        <View style={styles.topContainer}>
          {isRecording && (
            <View style={styles.timerBadge}>
              <View style={styles.redDot} />
              <Text style={styles.timerText}>{formatearTiempo(segundos)}</Text>
            </View>
          )}
        </View>

        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.secondaryButton, isRecording && styles.buttonDisabled]} 
            onPress={toggleCameraFacing} 
            disabled={isRecording}
          >
            <Text style={styles.textButtonSecondary}>Voltear</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={isRecording ? styles.buttonRecording : styles.button} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.textButton}>
              {isRecording ? 'Detener' : 'Grabar'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.placeholder} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', 
  },
  camera: {
    flex: 1,
  },
  // Nueva clase para la capa que flota encima de la cámara
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 10, // Asegura que esté por encima del render de la cámara
  },
  topContainer: {
    alignItems: 'center',
    marginTop: 50, 
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff3333',
    marginRight: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'], 
  },
  controlsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#333',
    borderRadius: 50,
    padding: 15,
    borderWidth: 2,
    borderColor: '#555',
    minWidth: 100,
    alignItems: 'center',
  },
  buttonRecording: {
    backgroundColor: '#ff3333',
    borderRadius: 50,
    padding: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#222',
    borderRadius: 30,
    padding: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  textButtonSecondary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ccc',
  },
  placeholder: {
    width: 70,
  },
  textMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  }
});