import React, {useCallback, useEffect, useState, useMemo} from 'react'
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, FlatList, KeyboardAvoidingView, ScrollView } from 'react-native'
import { TextInput, Snackbar, Modal } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import uuid from 'react-native-uuid';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";



const PurchaseCard = ({purchase, phone, addTransaction}) => {
    const {purchaseDate, amount, amountReceived, itemBought, goldRate, id} = purchase;
    const [selectedTX, setSelectedTX] = useState("");
    const date = useMemo(()=>new Date(purchaseDate).toLocaleString());
    const totalReceived = useMemo(()=>{
        return amountReceived.reduce((prev,curr)=>prev+curr.amount,0);
    },[amountReceived]);
    const [visible, setVisible] = useState(false);
    const hideModal = () => {
        setVisible(false);
    };
    

    const confirmDelete = async () => {
        const user = JSON.parse(await AsyncStorage.getItem(phone));
        let currPurchase = user.purchases.find(purchase => purchase.id === id);
        currPurchase={
            ...currPurchase,
            amountReceived: amountReceived.filter(tx=>tx.id!==selectedTX),
        };
        const finalObj = {
            ...user,
            purchases: [...user.purchases.filter(purchase => purchase.id !== id), currPurchase]
        };
        await AsyncStorage.setItem(phone, JSON.stringify(finalObj));
        setSelectedTX('');
        hideModal();
    };
    const editTransaction = async () => {

    }


    return (
        <View style={{backgroundColor: "#1C1C1C", marginVertical: 16, borderRadius: 4, padding: 16,}}>
            <Text style={styles.clientText}>Purchase Date: {date}</Text>
            <Text style={styles.clientText}>Amount: Rs.{amount}</Text>
            <Text style={styles.clientText}>Received to date: Rs.{totalReceived}</Text>
            <Text style={styles.clientText}>Amount Due: Rs.{amount - totalReceived}</Text>
            <Text style={styles.clientText}>Item Bought: {itemBought}</Text>
            <Text style={styles.clientText}>Gold Rate(at that time): Rs.{goldRate}</Text>
            <View style={{flexDirection: 'row', justifyContent:'space-between', alignItems: 'center'}}>
                <Text style={styles.clientText}>Transactions: </Text>
                <TouchableOpacity style={{backgroundColor: "#F1F1F1", paddingHorizontal: 6, paddingVertical: 4, borderRadius:2,}} onPress={()=>addTransaction(id)}><Text>Add</Text></TouchableOpacity>
            </View> 
            {amountReceived.map((history, index) => {
                const dts = new Date(history.date).toLocaleString();
                return (
                    <View style={styles.purchase} key={history.id}>
                        <Text style={styles.clientText}>{dts}</Text>
                        <View style={{flexDirection:'row', justifyContent: "space-between", alignItems: 'center'}}>
                            <Text style={styles.clientText}>Received Rs.{history.amount}</Text>
                            <View style={{flexDirection: "row", alignItems: 'center'}}>
                            {/* <TouchableOpacity style={{backgroundColor:"#F1F1F1", paddingHorizontal: 6, paddingVertical:4, borderRadius: 2,marginRight:8}}><Text>Edit</Text></TouchableOpacity> */}
                            <TouchableOpacity style={{backgroundColor:"#ED5E68", paddingHorizontal: 6, paddingVertical:4 , borderRadius:2,}} onPress={()=>{
                                setSelectedTX(history.id);
                                setVisible(true);
                            }} disabled={amountReceived.length === 1}><Text style={styles.clientText}>X</Text></TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )
            })}
            <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainerStyle}>
                <TouchableOpacity onPress={confirmDelete} style={styles.modalBTN}><Text style={styles.modalBTNText}>Confirm Delete</Text></TouchableOpacity>
                <TouchableOpacity onPress={hideModal} style={styles.modalBTN}><Text style={styles.modalBTNText}>Cancel</Text></TouchableOpacity>
            </Modal>
        </View>
    )
}


const SearchScreen = () => {
    const [phone,setPhone] = useState("");
    const [searchClients, setSearchClients] = useState([]);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [recordToDelete, setRecordToDelete] = useState("");
    const [visible, setVisible] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);  
    const isFocused = useIsFocused();
    const [activeClient, setActiveClient] = useState({});

    // add tx states
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [purchaseIDtoAddTX, setPurchaseIDtoAddTX] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [amountReceived, setAmountReceived] = useState(0);

    const hideAddModal = () => {
        setAddModalVisible(false);
        setAmountReceived(0);
        setShowDatePicker(false);
        setPurchaseIDtoAddTX("");
        setAmountReceived(0);
    };

    const addTransaction = (id) => {
        setPurchaseIDtoAddTX(id);
        setAddModalVisible(true);
    };
    const cleanNumber = useCallback((input)=>{
        return input.replace(/[^0-9]/g, "");
    },[]);

    const setPhoneNumber = useCallback((input)=>{
        setPhone(cleanNumber(input).slice(0,10));
    },[setPhone]);

    const findAllUsers = async () => {
        let matches = [];
        const numbers = await AsyncStorage.getAllKeys();
        for(const num of numbers) 
            matches.push(JSON.parse(await AsyncStorage.getItem(num)));
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
        setActiveClient({});
        if(phone===""){
            setSearchClients([]);
            setActiveClient({});
        }
    },[phone,isFocused]);

    const deleteRecord = (num) => {
        setRecordToDelete(num);
        showModal();
    };

    const confirmDelete = async () => {
        await AsyncStorage.removeItem(recordToDelete);
        hideModal();
        setSearchClients(prev => prev.filter(val=>val.phone != recordToDelete));
        setRecordToDelete("");
    };
    const dateHandler = (e, selectedDate) => {
        if(e.type === "set") setPurchaseDate(selectedDate);
        setShowDatePicker(false);
    }

    const confirmTransactionAdd = async () => {
        const tx = {
            amount: amountReceived,
            date: purchaseDate,
            id: uuid.v4(),
        }
        const purchaseOBJ = activeClient.purchases.find(purchase=>purchase.id===purchaseIDtoAddTX);
        purchaseOBJ.amountReceived.push(tx);
        const finalobj = {
            ...activeClient,
            purchases:[...activeClient.purchases.filter(purchase=>purchase.id!==purchaseIDtoAddTX), purchaseOBJ]
        }
        await AsyncStorage.setItem(activeClient.phone, JSON.stringify(finalobj));
        hideAddModal();
    };

    return (
        <>        
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TextInput style={styles.input} placeholder='Enter Phone Number' maxLength={10} value={phone} onChangeText={setPhoneNumber} keyboardType="numeric" activeUnderlineColor="#114084" />
                <TouchableOpacity style={styles.headerBTN} onPress={findAllUsers}><Text style={styles.BTNText}>Load All</Text></TouchableOpacity>
            </View>
            {!!searchClients.length && searchClients.map(client => (
                <View style={styles.searchItemWrapper} key={client.phone}>
                <TouchableOpacity activeOpacity={0.7} style={styles.client} disabled >
                    <Text style={styles.clientText}>{client.name}</Text>
                    <Text style={styles.clientText}>Total: {client.total}, Received: {client.totalReceived}, Due: {client.total-client.totalReceived}</Text>
                </TouchableOpacity>
                <View style={styles.BTNWrapper}>
                    <TouchableOpacity style={{...styles.BTN, backgroundColor: "#3466AA"}} onPress={()=>{setActiveClient(client)}}><Text style={styles.BTNText}>View</Text></TouchableOpacity>
                    <TouchableOpacity style={{...styles.BTN, backgroundColor: "#ED5E68"}} onPress={()=>deleteRecord(client.phone)}><Text style={styles.BTNText}>Delete</Text></TouchableOpacity>
                </View>
                </View>
            ))}
        </ScrollView>
        {!!Object.keys(activeClient).length && <ScrollView style={styles.detailsContainer}>
            <Text>Phone: {activeClient.phone}</Text>
            <Text>Name: {activeClient.name}</Text>
            {activeClient.purchases.map((purchase) => {
                return <PurchaseCard key={purchase.id} purchase={purchase} phone={activeClient.phone} addTransaction={addTransaction}/>
            })}
        </ScrollView>}
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainerStyle}>
          <TouchableOpacity onPress={confirmDelete} style={styles.modalBTN}><Text style={styles.modalBTNText}>Confirm Delete</Text></TouchableOpacity>
          <TouchableOpacity onPress={hideModal} style={styles.modalBTN}><Text style={styles.modalBTNText}>Cancel</Text></TouchableOpacity>
        </Modal>
        <Modal visible={addModalVisible} onDismiss={hideAddModal} contentContainerStyle={styles.AddModalContainerStyle}>
            <View style={styles.form}>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Amount Received</Text>
                    <TextInput style={styles.formInput} activeUnderlineColor="#114084" keyboardType="numeric" value={`${amountReceived}`} onChangeText={(e)=>setAmountReceived(cleanNumber(e))}/>
                </View>
                <View style={styles.formInputContainer} >
                    <Text style={styles.inputLabel}>Transaction Date</Text>
                    <View style={{flexDirection:"row", width:"100%", justifyContent: 'space-between'}}>
                        <TextInput style={[styles.formInput,{flexShrink: 1}]} activeUnderlineColor="#114084" value={`${purchaseDate.toDateString()}`} />
                        <TouchableOpacity onPress={()=>setShowDatePicker(true)}>
                            <Icon name="calendar" size={32} />
                        </TouchableOpacity>
                    </View>
                    {showDatePicker && <DateTimePicker style={styles.formInput} show={showDatePicker} activeUnderlineColor="#114084" value={purchaseDate} is24Hour={true} onChange={dateHandler}/>}
                </View>
            </View>
            <View style={styles.AddModalButtonsRow}>
                <TouchableOpacity onPress={confirmTransactionAdd} style={{...styles.modalBTN, backgroundColor: "#3466AA"}}><Text style={styles.modalBTNText}>Confirm</Text></TouchableOpacity>
                <TouchableOpacity onPress={hideAddModal} style={{...styles.modalBTN, backgroundColor: "#ED5E68"}}><Text style={styles.modalBTNText}>Cancel</Text></TouchableOpacity>
            </View>
        </Modal>
        <Snackbar visible={snackbarVisible} onDismiss={()=>{setSnackbarVisible(false);setSnackbarMessage("");}} duration={4000}>{snackbarMessage}</Snackbar>
        </>
    )
}

export default SearchScreen

const styles = StyleSheet.create({
     container : {
        backgroundColor: "#F1F1F1",
        flex: 1,
        paddingTop: StatusBar.currentHeight + 24,
        paddingHorizontal: 16,
        paddingBottom: 16
    },
    detailsContainer: {
        backgroundColor: "#F1F1F1",
        padding: 16,
        flex: 1,
    },
    AddModalContainerStyle: {
        backgroundColor: "#F1F1F1",
        justifyContent:"flex-start",
        padding: 16,
        width: "90%",
        borderRadius: 8,
        alignSelf:"center",
    },
    AddModalButtonsRow: {
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "space-around",
        width: "100%",
    },
    input: {
        height: 48,
        width: "65%"
    },
    client: {
        backgroundColor: "#114084",
        padding: 16,
        borderRadius: 4, 
        width: "65%"
    },
    clientText: {
        color: "#F1F1F1",
        textAlign: "left"
    },
    searchItemWrapper: {
        flexDirection:"row",
        justifyContent: "space-between",
        alignItems: "stretch",
        marginVertical: 8
    },
    BTNWrapper: {
        width: "30%",
        alignItems: "center",
        justifyContent: 'space-between'
    },
    BTN: {
        backgroundColor: "#114084",
        width: "100%",
        padding: 8,
        borderRadius: 4,
    },
    BTNText: {
        color: "#F1F1F1",
        textAlign: "center"
    },
    header: {
        flexDirection: "row",
        marginBottom: 16,
        justifyContent: "space-between",
        width: "100%",
    },
    headerBTN: {
        width: "30%",
        backgroundColor: "#114084",
        padding: 8,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center"
    },
    modalContainerStyle: {
        position: "absolute",
        zIndex: 99,
        left: "10%",
        width: "80%",
        padding: 16,
        backgroundColor: "#F1F1F1",
        borderRadius: 4,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBTN: {
        padding: 16,
        backgroundColor: "#114084",
        marginHorizontal: 16,
        borderRadius: 4,
    },
    modalBTNText: {
        color: "#F1F1F1"
    },
    purchase: {
        backgroundColor: "#3466AA",
        padding: 8,
        borderRadius: 2,
        marginVertical: 4,
    },
    formInput: {
        height: 36,
    },
    formInputContainer: {
        width: "80%",
        margin: 16
    },
    inputLabel: {
        color: "#1C1C1C"
    },
    form: {
        flexDirection: "column",
        overflow: "hidden",
        alignItems:"center",
    },
})
