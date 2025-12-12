import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import PhysicalScreen from '../app/SelectGiftCard';
import ECodeScreen from '../app/AjoContribution';

const Tab = createMaterialTopTabNavigator();

const SellCryptoScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Physical" component={PhysicalScreen} />
      <Tab.Screen name="E-code" component={ECodeScreen} />
    </Tab.Navigator>
  );
};

export default SellCryptoScreen;
