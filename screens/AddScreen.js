import React, {useCallback, useEffect, useState} from 'react'
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, FlatList, KeyboardAvoidingView, ScrollView } from 'react-native'
import { TextInput, Snackbar } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import uuid from 'react-native-uuid';


const AddScreen = () => {
    const [phone,setPhone] = useState("");
    const [newUser, setNewUser] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [amount, setAmount] = useState(0);
    const [amountReceived, setAmountReceived] = useState(0);
    const [itemBought, setItemBought] = useState("");
    const [goldRate, setGoldRate] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchClients, setSearchClients] = useState([]);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const isFocused = useIsFocused();

    const resetForm = () => {
        setNewUser(true);
        setName("");
        setPurchaseDate(new Date());
        setAmount(0);
        setAmountReceived(0);
        setItemBought("");
        setGoldRate(0);
        setShowDatePicker(false);
        setSearchClients([]);
    }

    const cleanNumber = useCallback((input)=>{
        return input.replace(/[^0-9]/g, "");
    },[]);

    const setPhoneNumber = useCallback((input)=>{
        setPhone(cleanNumber(input).slice(0,10));
        setShowForm(false);
    },[setPhone]);

    const findUsers = async () => {
        if(phone) {
            const numbers = await AsyncStorage.getAllKeys();
            let matches = [];
            for(const num of numbers) {
                if(num.includes(phone) && phone.length >=3) {
                    matches.push(JSON.parse(await AsyncStorage.getItem(num)));
                }
            }
            matches = matches.map(match => {
                let totalReceived = 0;
                for(const purchase of match.purchases) {
                    totalReceived += purchase.amountReceived.reduce((acc,curr)=>acc+parseInt(curr.amount),0);
                }
                const total = match.purchases.reduce((acc,curr)=>{
                    return parseInt(acc) + parseInt(curr.amount);
                },0);
                return {
                    ...match,
                    total: `${total}`,
                    totalReceived: `${totalReceived}` 
                }
            })
            setSearchClients(matches);
        }
    }

    useEffect(()=>{
        findUsers();
        if(phone==="")
        setSearchClients([]);
    },[phone,isFocused]);

    const fetchOldClient = async (phone) => {
        const client = JSON.parse(await AsyncStorage.getItem(phone));
        setPhone(client.phone);
        setNewUser(false);
        setName(client.name);
        setShowForm(true);
    }

    const dateHandler = (e, selectedDate) => {
        if(e.type === "set") setPurchaseDate(selectedDate);
        setShowDatePicker(false);
    }

    const addNewClient = async () => {
        try{
        await AsyncStorage.setItem(phone, JSON.stringify({
            name,
            phone,
            purchases: [{
                id: uuid.v4(),
                purchaseDate,
                amount: parseInt(amount),
                amountReceived: [{
                    id:uuid.v4(),
                    amount: parseInt(amountReceived),
                    date: purchaseDate
                }],
                itemBought,
                goldRate: parseInt(goldRate)
            }]
        }));
        setShowForm(false);
        resetForm();
        setPhone("");
        setSnackbarMessage("User Created Successfully!")
        setSnackbarVisible(true);
        } catch (e) {
            setSnackbarMessage("Something went wrong! Please check if entry was created or not. ", e);
            setSnackbarVisible(true);
        }
    }

    const addPurchaseExistingClient = async () => {
        try {
            const existing = JSON.parse(await AsyncStorage.getItem(phone));
            await AsyncStorage.setItem(phone, JSON.stringify({
            name,
            phone,
            purchases: [...existing.purchases,{
                id: uuid.v4(),
                purchaseDate,
                amount: parseInt(amount),
                amountReceived: [{
                    id: uuid.v4(),
                    amount: parseInt(amountReceived),
                    date: purchaseDate
                }],
                itemBought,
                goldRate: parseInt(goldRate)
            }]
            }));
            setShowForm(false);
            resetForm();
            setPhone("");
            setSnackbarMessage("Purchase Entry Added Successfully!")
            setSnackbarVisible(true);
            setNewUser(true);
        }  catch (e) {
            setSnackbarMessage("Something went wrong! Please check if entry was created or not. ", e);
            setSnackbarVisible(true);
        }
    }

    const addPurchase = async () => {
        if(newUser)
            await addNewClient();
        else 
            await addPurchaseExistingClient();
    }

    return (
        <>        
        <ScrollView style={styles.container}>
            <Text style={styles.heading}>Add Purchase</Text>
            <TextInput style={styles.input} placeholder='Enter Phone Number' maxLength={10} value={phone} onChangeText={setPhoneNumber} keyboardType="numeric" activeUnderlineColor="#114084" />
            {searchClients.length ? searchClients.map(client => (
                <TouchableOpacity activeOpacity={0.7} style={styles.client} onPress={()=>fetchOldClient(client.phone)} key={client.phone}>
                    <Text style={styles.clientText}>{client.name} </Text>
                    <Text style={styles.clientText}>Total: {client.total}, Received: {client.totalReceived}, Due: {client.total-client.totalReceived}</Text>
                </TouchableOpacity>
            )) : phone.length===10 ? <TouchableOpacity style={styles.addClient} activeOpacity={0.7} onPress={()=>{resetForm();setShowForm(true);}}><Text style={styles.text}>Add New Client</Text></TouchableOpacity> : null}
            {showForm && 
            <View style={styles.form}>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" value={name} onChangeText={e=>setName(e)} disabled={!newUser}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" keyboardType="numeric" value={`${phone}`} onChangeText={e=>setPhone(cleanNumber(e).slice(0,10))} disabled={!newUser}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Date of purchase</Text>
                    <View style={{flexDirection:"row", width:"100%"}}>
                        <TextInput style={[styles.formInput,{flexShrink: 1}]} activeUnderlineColor="#114084" value={`${purchaseDate.toDateString()}`} />
                        <TouchableOpacity onPress={()=>setShowDatePicker(true)}>
                            <Icon name="calendar" size={32} />
                        </TouchableOpacity>
                    </View>
                    {showDatePicker && <DateTimePicker style={styles.formInput} show={showDatePicker} activeUnderlineColor="#114084" value={purchaseDate} is24Hour={true} onChange={dateHandler}/>}
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Amount Total</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" keyboardType="numeric" value={`${amount}`} onChangeText={e=>setAmount(cleanNumber(e))}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Amount Received</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" keyboardType="numeric" value={`${amountReceived}`} onChangeText={(e)=>setAmountReceived(cleanNumber(e))}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Amount Due</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" disabled value={`${amount - amountReceived}`}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Item Bought</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" value={itemBought} onChangeText={e=>setItemBought(e)}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Gold Rate</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" value={`${goldRate}`} keyboardType='numeric' onChangeText={e=>setGoldRate(cleanNumber(e))}/>
                </View>
                <TouchableOpacity style={styles.submit} onPress={addPurchase}>
                    <Text style={styles.text}>Submit</Text>
                </TouchableOpacity>
            </View>
            }
        </ScrollView>
        <Snackbar visible={snackbarVisible} onDismiss={()=>{setSnackbarVisible(false);setSnackbarMessage("");}} duration={4000}>{snackbarMessage}</Snackbar>
        </>
    )
}

export default AddScreen

const styles = StyleSheet.create({
     container : {
        backgroundColor: "#F1F1F1",
        flex: 1,
        paddingTop: StatusBar.currentHeight + 24,
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    heading: {
        color: "#1C1C1C",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign:"center",
    },
    input: {
        height: 48,
        marginBottom: 16
    },
    client: {
        backgroundColor: "#114084",
        padding: 16,
        borderRadius: 4, 
        marginVertical: 8
    },
    clientText: {
        color: "#F1F1F1",
    },
    addClient: {
        backgroundColor: "#114084",
        padding: 16,
        borderRadius: 4, 
    },
    text: {
        color: "#F1F1F1",
    },
    formInput: {
        height: 36,
    },
    formInputContainer: {
        width: "40%",
        margin: 16
    },
    inputLabel: {
        color: "#1C1C1C"
    },
    form: {
        flexDirection: "row",
        flexWrap: "wrap",
        borderColor: "#114084",
        borderWidth: 4,
        borderRadius: 4,
        overflow: "hidden",
        marginTop: 32,
    },
    submit: {
        backgroundColor: "#3466AA",
        flex: 1,
        padding: 16,
        borderRadius: 4,
        margin: 10,
        justifyContent: "center",
        alignItems: "center"
    }
})
