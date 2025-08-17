# Solución al Problema de Pérdida de Foco en TextInput

## Problema
Los TextInput en los modales de crear y editar usuario perdían el foco después de escribir cada carácter, obligando al usuario a hacer clic nuevamente para continuar escribiendo.

## Causa
El componente `FormField` estaba definido dentro de los componentes `CreateUserModal` y `EditUserModal`. Esto causaba que React recreara el componente en cada render, lo que hacía que los TextInput perdieran el foco.

## Solución
Se movió el componente `FormField` a un archivo separado en `/components/common/FormField.js`. Ahora es un componente estable que no se recrea en cada render.

### Archivos modificados:
1. **Creado**: `/app/components/common/FormField.js` - Componente FormField extraído
2. **Creado**: `/app/components/common/index.js` - Archivo índice para exportaciones comunes
3. **Modificado**: `/app/components/CreateUserModal.js` - Ahora importa FormField externo
4. **Modificado**: `/app/components/EditUserModal.js` - Ahora importa FormField externo

### Regla para evitar este problema en el futuro:
**Nunca definas componentes dentro de otros componentes**, especialmente si contienen inputs. Siempre define los componentes en el nivel superior del archivo o en archivos separados.

### Ejemplo del problema:
```javascript
// ❌ MAL - Causa pérdida de foco
const ParentComponent = () => {
  const [value, setValue] = useState('');
  
  const InputComponent = () => (  // Se recrea en cada render
    <TextInput value={value} onChangeText={setValue} />
  );
  
  return <InputComponent />;
};
```

### Ejemplo de la solución:
```javascript
// ✅ BIEN - Componente estable
const InputComponent = ({ value, onChangeText }) => (
  <TextInput value={value} onChangeText={onChangeText} />
);

const ParentComponent = () => {
  const [value, setValue] = useState('');
  
  return <InputComponent value={value} onChangeText={setValue} />;
};
```
