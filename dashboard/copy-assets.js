const fs = require('fs');
const path = require('path');

// Script para copiar assets que Expo no copia automáticamente

const copyFile = (src, dest) => {
  try {
    // Crear directorio de destino si no existe
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copiar archivo
    fs.copyFileSync(src, dest);
    console.log(`✅ Copiado: ${src} -> ${dest}`);
  } catch (error) {
    console.error(`❌ Error copiando ${src}:`, error.message);
  }
};

console.log('📁 Copiando assets faltantes...');

// Directorio base de dist
const distDir = './dist';
const nodeModulesDir = './node_modules';

// 1. Copiar fuentes de @expo/vector-icons
const fontsSourceDir = path.join(nodeModulesDir, '@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
const fontsDestDir = path.join(distDir, 'assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');

if (fs.existsSync(fontsSourceDir)) {
  const fontFiles = fs.readdirSync(fontsSourceDir);
  
  fontFiles.forEach(fontFile => {
    if (fontFile.endsWith('.ttf') || fontFile.endsWith('.woff') || fontFile.endsWith('.woff2')) {
      const srcPath = path.join(fontsSourceDir, fontFile);
      const destPath = path.join(fontsDestDir, fontFile);
      copyFile(srcPath, destPath);
    }
  });
} else {
  console.log('⚠️ No se encontró directorio de fuentes:', fontsSourceDir);
}

// 2. Copiar otros assets si es necesario
const assetsSourceDir = './assets';
const assetsDestDir = path.join(distDir, 'assets');

if (fs.existsSync(assetsSourceDir)) {
  // Copiar recursivamente assets
  const copyRecursive = (src, dest) => {
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(child => {
        copyRecursive(path.join(src, child), path.join(dest, child));
      });
    } else {
      copyFile(src, dest);
    }
  };
  
  console.log('📁 Copiando assets del proyecto...');
  copyRecursive(assetsSourceDir, assetsDestDir);
}

console.log('✅ Copia de assets completada!');