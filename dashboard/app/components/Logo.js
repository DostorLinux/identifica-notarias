// app/components/Logo.js

import React from 'react';
import { Image, StyleSheet } from 'react-native';

// 1) Ruta relativa desde app/components → assets/images/logo.png
const logoImage = require('../../assets/images/logo.png');

export default function Logo() {
  return <Image source={logoImage} style={styles.logo} />;
}

const styles = StyleSheet.create({
  logo: {
    width: 200,        // ajústalo al tamaño que necesites
    height: 200,
    resizeMode: 'contain',
  },
});