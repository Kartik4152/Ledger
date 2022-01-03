import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { HomeScreen, AddScreen, SearchScreen, SettingsScreen } from './screens';
import { StatusBar } from 'expo-status-bar';

const Tab = createMaterialBottomTabNavigator();

export default function App() {
  return (
    <>
    <StatusBar style='dark' backgroundColor='#F1F1F1'/>
    <NavigationContainer>
      <Tab.Navigator theme={DarkTheme} barStyle={{
        backgroundColor: "#3466AA"
      }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          )
        }}/>
        <Tab.Screen name="Add" component={AddScreen} options={{
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={26} />
          )
        }}/>
        <Tab.Screen name="Search" component={SearchScreen} options={{
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="book-search" color={color} size={26} />
          )
        }}/>
        <Tab.Screen name="Settings" component={SettingsScreen} options={{
          tabBarIcon: ({color}) => (
            <MaterialCommunityIcons name="cog" color={color} size={26} />
          )
        }}/>
      </Tab.Navigator>
    </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({});
