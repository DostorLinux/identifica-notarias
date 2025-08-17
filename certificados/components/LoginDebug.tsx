import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LoginDebugProps {
  onTestConnection?: () => void;
}

export default function LoginDebug({ onTestConnection }: LoginDebugProps) {
  const [testResult, setTestResult] = useState<string>('');

  const testCORS = async () => {
    try {
      setTestResult('Probando CORS...');
      
      // Probar endpoint simple primero
      const response = await fetch('http://access-control-test.identifica.ai/services/ping.php', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.text();
        setTestResult(`✅ CORS OK: ${data}`);
      } else {
        setTestResult(`❌ CORS Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testBasicAuth = async () => {
    try {
      setTestResult('Probando Basic Auth...');
      
      // Probar con credenciales de prueba
      const credentials = btoa('test:test');
      const response = await fetch('http://access-control-test.identifica.ai/services/login.php', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      const responseText = await response.text();
      setTestResult(`Response ${response.status}: ${responseText}`);
      
    } catch (error) {
      setTestResult(`❌ Auth Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testWithoutPreflight = async () => {
    try {
      setTestResult('Probando sin preflight (GET con auth)...');
      
      // Intentar un GET simple con Authorization para evitar preflight
      const credentials = btoa('test:test');
      const response = await fetch('http://access-control-test.identifica.ai/services/login.php?' + new URLSearchParams({
        method: 'login'
      }), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      });
      
      const responseText = await response.text();
      setTestResult(`GET Response ${response.status}: ${responseText}`);
      
    } catch (error) {
      setTestResult(`❌ GET Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSystemBasicAuth = async () => {
    try {
      setTestResult('Probando Basic Auth con credenciales del sistema...');
      
      // Probar Basic Auth con credenciales reales
      const credentials = btoa('admin:admin'); // cambiar por credenciales reales
      const response = await fetch('http://access-control-test.identifica.ai/services/login.php', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });
      
      const responseText = await response.text();
      setTestResult(`System Basic Auth ${response.status}: ${responseText}`);
      
    } catch (error) {
      setTestResult(`❌ System Basic Auth Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testMultipleMethods = async () => {
    try {
      setTestResult('Probando múltiples métodos de autenticación...');
      
      const credentials = 'admin:admin'; // cambiar por credenciales reales
      const credentials64 = btoa(credentials);
      const baseUrl = 'http://access-control-test.identifica.ai/services/login.php';
      
      let results = '';
      
      // Método 1: POST con Basic Auth
      try {
        const response1 = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials64}`,
            'Content-Type': 'application/json',
          },
        });
        results += `POST+BasicAuth+JSON: ${response1.status}\n`;
      } catch (e) {
        results += `POST+BasicAuth+JSON: Error\n`;
      }
      
      // Método 2: POST con Basic Auth sin Content-Type
      try {
        const response2 = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials64}`,
          },
        });
        results += `POST+BasicAuth: ${response2.status}\n`;
      } catch (e) {
        results += `POST+BasicAuth: Error\n`;
      }
      
      // Método 3: GET con Basic Auth
      try {
        const response3 = await fetch(baseUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${credentials64}`,
          },
        });
        results += `GET+BasicAuth: ${response3.status}\n`;
      } catch (e) {
        results += `GET+BasicAuth: Error\n`;
      }
      
      setTestResult(results);
      
    } catch (error) {
      setTestResult(`❌ Multiple Methods Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testServerInfo = async () => {
    try {
      setTestResult('Obteniendo info del servidor...');
      
      const response = await fetch('http://access-control-test.identifica.ai/services/ping.php', {
        method: 'GET',
      });
      
      const responseText = await response.text();
      setTestResult(`Server Info ${response.status}: ${responseText}`);
      
    } catch (error) {
      setTestResult(`❌ Server Info Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testPreflightManual = async () => {
    try {
      setTestResult('Probando preflight manual...');
      
      // Hacer OPTIONS request manual
      const optionsResponse = await fetch('http://access-control-test.identifica.ai/services/login.php', {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization,content-type',
          'Origin': window.location.origin,
        },
      });
      
      let result = `OPTIONS Response: ${optionsResponse.status}\n`;
      result += `Headers:\n`;
      optionsResponse.headers.forEach((value, key) => {
        result += `  ${key}: ${value}\n`;
      });
      
      setTestResult(result);
      
    } catch (error) {
      setTestResult(`❌ Preflight Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDifferentPath = async () => {
    try {
      setTestResult('Probando ruta correcta...');
      
      // Probar la ruta exacta que está en el servidor
      const credentials = btoa('test:test');
      const response = await fetch('http://access-control-test.identifica.ai/services/login.php', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      const responseText = await response.text();
      setTestResult(`Gate Path Response ${response.status}: ${responseText}`);
      
    } catch (error) {
      setTestResult(`❌ Gate Path Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug de Conexión</Text>
      
      <TouchableOpacity style={styles.button} onPress={testCORS}>
        <Text style={styles.buttonText}>Probar CORS</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testBasicAuth}>
        <Text style={styles.buttonText}>Probar Basic Auth</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testWithoutPreflight}>
        <Text style={styles.buttonText}>GET sin Preflight</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testSystemBasicAuth}>
        <Text style={styles.buttonText}>Basic Auth Sistema</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testMultipleMethods}>
        <Text style={styles.buttonText}>Múltiples Métodos</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testServerInfo}>
        <Text style={styles.buttonText}>Info Servidor</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testPreflightManual}>
        <Text style={styles.buttonText}>Probar Preflight</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testDifferentPath}>
        <Text style={styles.buttonText}>Probar Ruta Gate</Text>
      </TouchableOpacity>
      
      {testResult ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{testResult}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});