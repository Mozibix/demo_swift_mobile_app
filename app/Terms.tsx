import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const Terms = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms and Conditions</Text>
      <Text style={styles.subText}>
        By Using our products and services you confirm that you are in agreement
        with and bound by the following terms and conditions.
      </Text>
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.paragraph}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati
          illum expedita commodi natus doloremque distinctio! Eaque maiores,
          cumque rerum, odio voluptatum, distinctio laborum dolorem rem et
          reprehenderit itaque debitis asperiores. Lorem ipsum dolor, sit amet
          consectetur adipisicing elit. Et, exercitationem accusantium suscipit
          cupiditate itaque impedit repellendus molestias architecto tempora
          similique obcaecati cumque minima reprehenderit dolor! Vitae et alias
          tempora vel? Lorem ipsum dolor, sit amet consectetur adipisicing elit.
          Magnam vero reprehenderit asperiores iusto laboriosam, corrupti
          reiciendis soluta, repellat quos veritatis assumenda accusamus
          pariatur ipsum corporis sequi maxime aut nihil cum.
        </Text>

        <Text style={styles.sectionTitle}>License</Text>
        <Text style={styles.paragraph}>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Corporis
          aperiam minima dolorem inventore perspiciatis, deserunt architecto
          veniam excepturi quas fugiat amet tempore, ut saepe accusantium! Hic
          placeat eum in porro. Lorem ipsum dolor, sit amet consectetur
          adipisicing elit. Quisquam error saepe dolorum ipsum maxime, provident
          sit reprehenderit velit sunt labore voluptate eius illum magni nisi
          quo? Sed quis dolor tempore. Lorem ipsum dolor sit amet, consectetur
          adipisicing elit. Eum nulla voluptate facere temporibus vitae, modi
          earum error deleniti praesentium! Rem reprehenderit ab, rerum
          cupiditate quia voluptatibus quod nulla beatae ea.
        </Text>
      </ScrollView>

      {/* <TouchableOpacity style={styles.acceptButton}>
        <Text style={styles.acceptButtonText}>Accept Terms</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default Terms;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
    marginTop: 30,
  },
  contentContainer: {
    flex: 1,
    marginBottom: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 15,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 14,
    color: "#666",
    lineHeight: 24,
    textAlign: "justify",
    marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: "#0000ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  subText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
