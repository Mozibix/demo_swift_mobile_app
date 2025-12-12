import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const DeviceSessions = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Devices</Text>
      <Text style={styles.description}>
        You are signed in on these devices or have been in the last 26 days.
        There might be multiple activity sessions on each device.
        <Text style={styles.learnMore}> Learn More</Text>
      </Text>

      {/* Device Section 1 */}
      <View style={styles.deviceSection}>
        <View style={styles.deviceHeader}>
          <MaterialIcons name="laptop" size={24} color="#3b82f6" />
          <Text style={styles.deviceTitle}>2 Sessions on Windows Computer</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>What's this?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.session}>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionText}>Windows 7</Text>
            <Text style={styles.sessionLocation}>Lagos, Nigeria</Text>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionBrowser}>Google Chrome</Text>
            <Text style={styles.currentSession}>Your current session</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
        </View>

        <View style={styles.session}>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionText}>Windows 7</Text>
            <Text style={styles.sessionLocation}>Lagos, Nigeria</Text>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionBrowser}>Google Chrome</Text>
            <Text style={styles.sessionDate}>Aug 04, 2024</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
        </View>
      </View>

      {/* Device Section 2 */}
      <View style={styles.deviceSection}>
        <View style={styles.deviceHeader}>
          <MaterialIcons name="smartphone" size={24} color="#3b82f6" />
          <Text style={styles.deviceTitle}>2 Sessions on Mobile devices</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>What's this?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.session}>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionText}>iPhone XR</Text>
            <Text style={styles.sessionLocation}>Lagos, Nigeria</Text>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionBrowser}>Google Chrome</Text>
            <Text style={styles.currentSession}>Your current session</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
        </View>

        <View style={styles.session}>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionText}>Samsung S23 Ultra</Text>
            <Text style={styles.sessionLocation}>Lagos, Nigeria</Text>
          </View>
          <View style={styles.sessionDetails}>
            <Text style={styles.sessionBrowser}>Google Chrome</Text>
            <Text style={styles.sessionDate}>Aug 04, 2024</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
        </View>
      </View>
    </View>
  );
};

export default DeviceSessions;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  learnMore: {
    color: "#3b82f6",
    textDecorationLine: "underline",
  },
  deviceSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  deviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  linkText: {
    color: "#3b82f6",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  session: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  sessionDetails: {
    flex: 1,
    flexDirection: "column",
    marginRight: 10,
  },
  sessionText: {
    fontSize: 16,
    color: "#333",
  },
  sessionLocation: {
    fontSize: 14,
    color: "#666",
  },
  sessionBrowser: {
    fontSize: 14,
    color: "#666",
  },
  currentSession: {
    fontSize: 14,
    color: "#3b82f6",
  },
  sessionDate: {
    fontSize: 14,
    color: "#666",
  },
});
