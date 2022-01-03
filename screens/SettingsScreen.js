import React, {useState} from 'react'
import { FlatList, StatusBar, StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native';
import { Snackbar, Modal } from 'react-native-paper';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from "expo-document-picker";
import _ from "lodash";

const SettingsScreen = () => {
    const [visible, setVisible] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const wipeData = async () => {
        try{
            await AsyncStorage.clear();
            setSnackbarMessage("Wiped Data Successfully!");
            setSnackbarVisible(true);
            hideModal();
        } catch (e) {
            setSnackbarMessage("Failed to wipe data. ", e);
            setSnackbarVisible(true);
        }
    }
    const importData = async () => {
        try {
        const doc = await DocumentPicker.getDocumentAsync();
        const data = await FileSystem.readAsStringAsync(doc.uri);
        const localState = JSON.parse(data);
        for (const obj of localState) {
            const already = JSON.parse(await AsyncStorage.getItem(obj.phone));
            if(already && Object.keys(already).length) {
                const merged = _.merge(obj, already);
                await AsyncStorage.setItem(merged.phone, JSON.stringify(merged));     
            }
            else
            {
                await AsyncStorage.setItem(obj.phone, JSON.stringify(obj));
            }
        }
        setSnackbarMessage("Successfully Imported Data");
        setSnackbarVisible(true);
    }
    catch (e) {
        setSnackbarMessage("Something went wrong", e);
        setSnackbarVisible(true);
    }
    }

    const exportData = async () => {
        const keys = await AsyncStorage.getAllKeys();
        if(keys.length === 0)
            {
                setSnackbarMessage("No Data To Export!");
                setSnackbarVisible(true);
                return;
            }
        let JSONString = "[";
        for(const key of keys) {
            JSONString+=await AsyncStorage.getItem(key) + ","
        }
        JSONString=JSONString.replace(/,$/,"]");
        const currDateTime = new Date();
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync("content://com.android.externalstorage.documents/tree/primary%3ALedger-Backups");
        if(permissions.granted) {
            const uri = permissions.directoryUri;
            try {
                const fileuri = await FileSystem.StorageAccessFramework.createFileAsync(uri, `backup-${currDateTime.toISOString()}`, "application/json");
                await FileSystem.writeAsStringAsync(fileuri, JSONString);
                setSnackbarMessage("Successfully Exported Data");
                setSnackbarVisible(true);
            } catch (e) {
                setSnackbarMessage("Data Export Failed");
                setSnackbarVisible(true);
        }
        }
    }
    return (
        <>
        <View style={styles.container}>
            <Text style={styles.heading}>Settings</Text>
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={importData}>
                <Text style={styles.buttonText}>Import Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={exportData}>
                <Text style={styles.buttonText}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={showModal}>
                <Text style={styles.buttonText}>Wipe Data</Text>
            </TouchableOpacity>
        </View>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainerStyle}>
          <TouchableOpacity onPress={wipeData} style={styles.modalBTN}><Text style={styles.modalBTNText}>Confirm Wipe</Text></TouchableOpacity>
          <TouchableOpacity onPress={hideModal} style={styles.modalBTN}><Text style={styles.modalBTNText}>Cancel</Text></TouchableOpacity>
        </Modal>
        <Snackbar visible={snackbarVisible} onDismiss={()=>{setSnackbarVisible(false);setSnackbarMessage("");}} duration={4000}>{snackbarMessage}</Snackbar>
        </>
    )
}

export default SettingsScreen

const styles = StyleSheet.create({
    container : {
        backgroundColor: "#F1F1F1",
        flex: 1,
        paddingTop: StatusBar.currentHeight + 24,
        alignItems: "center",
        paddingHorizontal: 16
    },
    heading: {
        color: "#1C1C1C",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16
    },
    button: {
        backgroundColor: "#114084",
        padding: 16,
        borderRadius: 4,
        marginVertical: 8,
        width: "100%",
        justifyContent: "center",
        alignItems: "center"
    },
    buttonText: {
        color: "#F1F1F1",
        fontSize: 16,
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
        borderRadius: 4
    },
    modalBTNText: {
        color: "#F1F1F1"
    }
})
