import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Asset } from 'expo-asset';

export const generateCertificatePDF = async (biometricRecord, operatorRut = null) => {
  try {
    console.log('🔄 Generando certificado PDF en servidor para:', biometricRecord);
    console.log('👤 RUT del operario:', operatorRut);
    
    // Debug: ver todas las propiedades del biometricRecord
    console.log('🔍 Propiedades del biometricRecord:', Object.keys(biometricRecord));
    console.log('🔍 firstName actual:', biometricRecord.firstName || biometricRecord.first_name);
    console.log('🔍 lastName actual:', biometricRecord.lastName || biometricRecord.last_name);
    
    // Obtener configuración de API del servidor
    let baseUrl = null;
    try {
      // Primero intentar obtener la configuración del servidor
      const serverConfigUrl = `${window.location.origin}/config/api.json`;
      console.log('🔧 Obteniendo configuración del servidor:', serverConfigUrl);
      
      const configResponse = await fetch(serverConfigUrl, {
        method: 'GET',
        timeout: 5000
      });
      
      if (configResponse.ok) {
        const serverConfig = await configResponse.json();
        if (serverConfig?.subdomain) {
          baseUrl = `https://${serverConfig.subdomain}`;
          console.log('✅ Usando configuración del servidor:', baseUrl);
        }
      }
    } catch (serverConfigError) {
      console.log('⚠️ Error obteniendo configuración del servidor:', serverConfigError.message);
    }
    
    // Fallback: usar el origen de la ventana (dominio actual del servidor)
    if (!baseUrl) {
      baseUrl = window.location.origin;
      console.log('🔧 Usando origen de la ventana como fallback:', baseUrl);
    }
    
    // Formatear timestamp para el servidor
    const timestamp = biometricRecord.timestamp ? 
      Math.floor(new Date(biometricRecord.timestamp).getTime() / 1000) : 
      Math.floor(Date.now() / 1000);
    
    // Construir URL con parámetros
    const certificateUrl = `${baseUrl}/detect/services/generateCertificate.php`;
    
    // Handle different field naming conventions
    const firstName = biometricRecord.firstName || biometricRecord.first_name || '';
    const lastName = biometricRecord.lastName || biometricRecord.last_name || '';
    
    console.log('📝 Nombres procesados para certificado:', { firstName, lastName });
    
    const params = new URLSearchParams({
      rut: biometricRecord.rut,
      firstName: firstName,
      lastName: lastName,
      eventId: biometricRecord.eventId || biometricRecord.event_id || '',
      timestamp: timestamp.toString(),
      ...(operatorRut && { operatorRut })
    });
    
    const fullUrl = `${certificateUrl}?${params}`;
    console.log('📄 Solicitando certificado desde:', fullUrl);
    
    // Solicitar certificado al servidor
    const response = await fetch(fullUrl, {
      method: 'GET',
      timeout: 30000 // 30 segundos
    });
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    // Verificar si la respuesta es un PDF
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      // Si no es PDF, probablemente sea un error JSON
      const errorText = await response.text();
      console.error('❌ Respuesta del servidor no es PDF:', errorText);
      throw new Error('El servidor no retornó un PDF válido');
    }
    
    // Obtener el PDF como blob
    const pdfBlob = await response.blob();
    const pdfUri = URL.createObjectURL(pdfBlob);
    
    console.log('✅ PDF generado exitosamente');
    
    // Crear elemento temporal para descarga
    const link = document.createElement('a');
    link.href = pdfUri;
    link.download = `certificado_${biometricRecord.rut}_${new Date().toISOString().slice(0,10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL del blob
    setTimeout(() => URL.revokeObjectURL(pdfUri), 1000);
    
    Alert.alert(
      '✅ Certificado Generado',
      'El certificado PDF ha sido descargado exitosamente.',
      [{ text: 'OK' }]
    );
    
    return pdfUri;
    
  } catch (error) {
    console.error('❌ Error generando certificado PDF:', error);
    Alert.alert(
      'Error',
      'No se pudo generar el certificado PDF: ' + error.message
    );
    throw error;
  }
};

const getBackgroundImage = async () => {
  try {
    // Intentar cargar la imagen de fondo personalizada
    const asset = Asset.fromModule(require('../assets/images/certificado-background.png'));
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  } catch (error) {
    console.log('Imagen de fondo personalizada no encontrada, usando predeterminada');
    // Retornar una imagen base64 simple si no hay imagen personalizada
    return null;
  }
};

const generateAuditNumber = () => {
  const prefix = 'CERT-';
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}${timestamp.slice(-6)}${random}`;
};

const getPhotoEvidence = async (biometricRecord) => {
  try {
    console.log('🔍 Obteniendo evidencia fotográfica para:', biometricRecord.rut);
    
    // Obtener configuración de API del servidor
    let baseUrl = null;
    try {
      // Primero intentar obtener la configuración del servidor
      const serverConfigUrl = `${window.location.origin}/config/api.json`;
      console.log('🔧 Obteniendo configuración del servidor para evidencia:', serverConfigUrl);
      
      const configResponse = await fetch(serverConfigUrl, {
        method: 'GET',
        timeout: 5000
      });
      
      if (configResponse.ok) {
        const serverConfig = await configResponse.json();
        if (serverConfig?.subdomain) {
          baseUrl = `https://${serverConfig.subdomain}`;
          console.log('✅ Usando configuración del servidor para evidencia:', baseUrl);
        }
      }
    } catch (serverConfigError) {
      console.log('⚠️ Error obteniendo configuración del servidor para evidencia:', serverConfigError.message);
    }
    
    // Fallback: usar el origen de la ventana (dominio actual del servidor)
    if (!baseUrl) {
      baseUrl = window.location.origin;
      console.log('🔧 Usando origen de la ventana como fallback para evidencia:', baseUrl);
    }
    
    const evidence = {
      capturedImage: null,
      systemImage: null
    };
    
    // 1. Obtener imagen capturada durante verificación
    try {
      const capturedImageUrl = `${baseUrl}/detect/services/getCapturedImage.php`;
      const capturedParams = new URLSearchParams({
        rut: biometricRecord.rut,
        ...(biometricRecord.eventId && { eventId: biometricRecord.eventId })
      });
      
      console.log('📸 Solicitando imagen capturada:', `${capturedImageUrl}?${capturedParams}`);
      
      const capturedResponse = await fetch(`${capturedImageUrl}?${capturedParams}`, {
        method: 'GET',
        timeout: 15000
      });
      
      if (capturedResponse.ok) {
        const capturedResult = await capturedResponse.json();
        if (capturedResult.success && capturedResult.image) {
          evidence.capturedImage = capturedResult.image;
          console.log('✅ Imagen capturada obtenida exitosamente');
        }
      }
    } catch (capturedError) {
      console.log('⚠️ Error obteniendo imagen capturada:', capturedError.message);
    }
    
    // 2. Obtener imagen del sistema (usuario registrado)
    try {
      const systemImageUrl = `${baseUrl}/services/getPicture.php`;
      const systemParams = new URLSearchParams({
        rut: biometricRecord.rut
      });
      
      console.log('🖼️ Solicitando imagen del sistema:', `${systemImageUrl}?${systemParams}`);
      
      const systemResponse = await fetch(`${systemImageUrl}?${systemParams}`, {
        method: 'GET',
        timeout: 15000
      });
      
      if (systemResponse.ok) {
        const systemResult = await systemResponse.json();
        if (systemResult.success && systemResult.image) {
          evidence.systemImage = systemResult.image;
          console.log('✅ Imagen del sistema obtenida exitosamente');
        }
      }
    } catch (systemError) {
      console.log('⚠️ Error obteniendo imagen del sistema:', systemError.message);
    }
    
    console.log('📋 Evidencia fotográfica:', {
      capturedImage: evidence.capturedImage ? 'Disponible' : 'No disponible',
      systemImage: evidence.systemImage ? 'Disponible' : 'No disponible'
    });
    
    return evidence;
    
  } catch (error) {
    console.error('❌ Error obteniendo evidencia fotográfica:', error);
    return {
      capturedImage: null,
      systemImage: null
    };
  }
};

const createCertificateHTML = ({
  backgroundImage,
  fullName,
  auditNumber,
  rut,
  registrationDate,
  verificationDate,
  institution,
  operatorRut,
  capturedImage,
  systemImage
}) => {
  const backgroundStyle = backgroundImage 
    ? `background-image: url('${backgroundImage}'); background-size: cover; background-position: center;`
    : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
    
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificado de Verificación Biométrica</title>
      <style>
        @page {
          margin: 20px;
          size: A4 portrait;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        
        .certificate-container {
          background: white;
          border: 2px solid #2E86AB;
          border-radius: 10px;
          padding: 30px;
          margin: 0 auto;
          max-width: 550px;
          position: relative;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #2E86AB;
          padding-bottom: 30px;
        }
        
        .title-main {
          font-size: 48px;
          font-weight: bold;
          color: #2E86AB;
          margin: 0;
          letter-spacing: 3px;
        }
        
        .subtitle {
          font-size: 18px;
          color: #666;
          margin: 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .verification-status {
          font-size: 28px;
          font-weight: bold;
          color: #28a745;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .checkmark {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid #28a745;
          margin: 15px auto;
          background: #28a745;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 30px;
          font-weight: bold;
        }
        
        .info-section {
          margin: 30px 0;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 15px 0;
          padding: 15px;
          background: rgba(46, 134, 171, 0.1);
          border-radius: 10px;
          border-left: 4px solid #2E86AB;
        }
        
        .info-label {
          font-weight: bold;
          color: #333;
          font-size: 16px;
          min-width: 180px;
        }
        
        .info-value {
          color: #555;
          font-size: 16px;
          text-align: right;
          flex: 1;
        }
        
        .evidence-section {
          text-align: center;
          margin: 40px 0;
          padding: 30px;
          background: rgba(0,0,0,0.05);
          border-radius: 15px;
        }
        
        .evidence-title {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .fingerprint-placeholder {
          width: 120px;
          height: 120px;
          border: 3px dashed #666;
          border-radius: 10px;
          margin: 20px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.8);
          color: #666;
          font-size: 12px;
          text-align: center;
        }
        
        .photo-evidence-container {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 30px 0;
          gap: 20px;
        }
        
        .photo-evidence-item {
          text-align: center;
          flex: 1;
        }
        
        .photo-evidence-image {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          border: 2px solid #2E86AB;
          object-fit: cover;
          background: white;
          display: block;
          margin: 0 auto;
        }
        
        .photo-evidence-placeholder {
          width: 120px;
          height: 120px;
          border: 2px dashed #666;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9f9f9;
          color: #666;
          font-size: 11px;
          text-align: center;
          margin: 0 auto;
        }
        
        .photo-evidence-label {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #eee;
          font-size: 12px;
          color: #666;
        }
        
        .qr-placeholder {
          width: 100px;
          height: 100px;
          border: 2px solid #333;
          margin: 20px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #333;
        }
        
        .validation-info {
          margin-top: 20px;
          font-size: 11px;
          color: #666;
        }
        
        .logo-placeholder {
          position: absolute;
          top: 30px;
          right: 30px;
          width: 100px;
          height: 100px;
          border: 2px dashed #ccc;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #999;
          background: rgba(255,255,255,0.8);
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="logo-placeholder">
          LOGO<br>NOTARÍA
        </div>
        
        <div class="header">
          <h1 class="title-main">CERTIFICADO</h1>
          <p class="subtitle">COMPROBANTE DE VERIFICACIÓN</p>
          <h2 class="verification-status">VERIFICACIÓN APROBADA</h2>
          <div class="checkmark">✓</div>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Nombre:</span>
            <span class="info-value">${fullName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Número de auditoría:</span>
            <span class="info-value">${auditNumber}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">RUT Verificado:</span>
            <span class="info-value">${rut}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Fecha de Registro:</span>
            <span class="info-value">${registrationDate}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Fecha de Verificación:</span>
            <span class="info-value">${verificationDate}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Institución:</span>
            <span class="info-value">${institution}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">RUT Operario:</span>
            <span class="info-value">${operatorRut}</span>
          </div>
        </div>
        
        <div class="evidence-section">
          <h3 class="evidence-title">REGISTRO DE EVIDENCIAS</h3>
          
          <div class="photo-evidence-container">
            <div class="photo-evidence-item">
              ${capturedImage ? 
                `<img src="${capturedImage}" alt="Foto Capturada" class="photo-evidence-image" />` :
                `<div class="photo-evidence-placeholder">
                  Foto no<br>disponible
                </div>`
              }
              <div class="photo-evidence-label">Foto Capturada</div>
            </div>
            
            <div class="photo-evidence-item">
              ${systemImage ? 
                `<img src="${systemImage}" alt="Foto del Sistema" class="photo-evidence-image" />` :
                `<div class="photo-evidence-placeholder">
                  Foto no<br>disponible
                </div>`
              }
              <div class="photo-evidence-label">Foto del Sistema</div>
            </div>
          </div>
          
          <div class="fingerprint-placeholder">
            Constancia dactilar<br>
            (Huella digital)
          </div>
        </div>
        
        <div class="footer">
          <div style="text-align: center; margin: 20px 0; padding: 15px; border: 1px solid #ddd; background: #f9f9f9;">
            <p style="margin: 5px 0; font-size: 12px;"><strong>Código de Validación:</strong> ${auditNumber}</p>
            <p style="margin: 5px 0; font-size: 11px;">Su validez puede ser verificada en el sitio Web</p>
            <p style="margin: 5px 0; font-size: 11px;"><strong>Documento generado electrónicamente</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};