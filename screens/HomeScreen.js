import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
    const [total,setTotal] = useState(0);
    const [received, setReceived] = useState(0);
    const [due,setDue] = useState(0);
    const isFocused = useIsFocused();
    useEffect(()=>{
        (async ()=>{
            if(isFocused) {
                let purchaseList = [];
                const keys = await AsyncStorage.getAllKeys();
                for (const key of keys) {
                    const { purchases } = JSON.parse(await AsyncStorage.getItem(key));
                    purchaseList.push(...purchases.filter(purchase => {
                        const currentMonth = new Date().getMonth();
                        const purchaseMonth = new Date(purchase.purchaseDate).getMonth();
                        return currentMonth === purchaseMonth;
                    }));
                }
                let total=0,received=0;
                purchaseList.forEach(purchase => {
                    total+=parseInt(purchase.amount);
                    received+=purchase.amountReceived.reduce((acc,curr)=>{
                        return acc + parseInt(curr.amount)
                    },0)
                })
                setTotal(total);
                setReceived(received);
                setDue(total-received);
            }
        })();
    },[isFocused])
    return (
        <View style={styles.container}>
            <Image source={require("../assets/logo.png")} style={styles.logo}/>
            <Image source={require("../assets/textlogo.png")} style={styles.textLogo}/>
            <View style={styles.infoButton}>
                <Text style={styles.text}>Total Sales (This Month): Rs.{total}</Text>
            </View>
            <View style={styles.infoButton}>
                <Text style={styles.text}>Total Received (This Month): Rs.{received}</Text>
            </View>
            <View style={styles.infoButton}>
                <Text style={styles.text}>Total Due (This Month): Rs.{due}</Text>
            </View>
        </View>
    )
}

export default HomeScreen

const styles = StyleSheet.create({
    container : {
        backgroundColor: "#F1F1F1",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    text: {
        marginVertical: 8,
        fontSize: 16,
        color: "#F1F1F1"
    },
    infoButton: {
        padding: 8,
        backgroundColor: "#114084",
        width: "100%",
        marginVertical: 8,
        borderRadius: 4
    },
    logo: {
        height: 80,
        width: 80
    },
    textLogo: {
        height: 160,
        width: "100%"
    }
})
