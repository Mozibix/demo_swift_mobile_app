import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInput as RNTextInput,
  ActivityIndicator,
  Pressable,
} from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
const API_BASE_URL = "https://swiftpaymfb.com/api";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import Button from "@/components/ui/Button";
import { showLogs } from "@/utils/logger";
import KAScrollView from "@/components/ui/KAScrollView";
import LoadingComp from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/Colors";

interface FormData {
  contributionName: string;
  description: string;
  type: string;
  frequency: string;
  amount: string;
  no_of_members: string;
  start_date: string;
  cover_image: string | null;
}

interface ApiErrors {
  [key: string]: string | string[];
}

interface ApiData {
  name: string;
  description: string;
  type: string;
  frequency: string;
  amount: string;
  no_of_members: string;
  start_date: string;
  cover_image: string | null;
}

const AjoContributionComponent = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      contributionName: "",
      description: "",
      type: "Select type",
      frequency: "Select frequency",
      amount: "",
      no_of_members: "",
      start_date: new Date().toISOString(),
      cover_image: null,
    },
  });

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showReasonModal, setShowReasonModal] = useState<boolean>(false);
  const [showTypeModal, setShowTypeModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState("");
  const { getUserProfile } = useAuth();

  const [apiErrors, setApiErrors] = useState<ApiErrors>({});

  const watchAmount = watch("amount");
  const watchDate = watch("start_date") as string | Date;
  const watchImage = watch("cover_image");

  const onChangeDate = (event: any, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue("start_date", selectedDate.toISOString());
    }
  };

  const pickImage = async (): Promise<void> => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Required",
          text2: "You need to grant access to your photos to upload an image.",
          position: "top",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setValue("cover_image", result.assets[0].uri);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error || "Failed to select image. Please try again.",
        text2: "Opps! Something went wrong.",
        position: "top",
      });
    }
  };

  const mapFormToApiData = (data: FormData): ApiData => {
    const typeMap: { [key: string]: string } = {
      "Personal Contribution": "personal",
      "Business Contribution": "business",
    };

    const frequencyMap: { [key: string]: string } = {
      "Weekly Contribution": "weekly",
      "Monthly Contribution": "monthly",
      "Yearly Contribution": "yearly",
    };

    const formattedDate =
      typeof data.start_date !== "string"
        ? (data.start_date as Date).toISOString().split("T")[0]
        : data.start_date.toString();

    return {
      name: data.contributionName,
      description: data.description,
      type: typeMap[data.type] || "personal",
      frequency: frequencyMap[data.frequency] || "weekly",
      amount: data.amount,
      no_of_members: data.no_of_members,
      start_date: formattedDate,
      cover_image: data.cover_image,
    };
  };

  const onSubmit = async (data: FormData): Promise<void> => {
    if (data.type === "Select Reason") {
      Toast.show({
        type: "error",
        text1: "Type Required",
        text2: "Please select a contribution type",
        position: "top",
      });
      return;
    }

    if (data.frequency === "Select frequency") {
      Toast.show({
        type: "error",
        text1: "Frequency Required",
        text2: "Please select contribution frequency",
        position: "top",
      });
      setError("");
      return;
    }

    setLoading(true);
    setApiErrors({});

    try {
      const formData = watch();
      const apiData = mapFormToApiData(formData);

      const requestFormData = new FormData();

      Object.keys(apiData).forEach((key) => {
        if (key !== "cover_image") {
          const value = apiData[key as keyof ApiData];
          if (value !== null) {
            requestFormData.append(key, value);
          }
        }
      });

      if (apiData.cover_image) {
        const uriParts = apiData.cover_image.split(".");
        const fileType = uriParts[uriParts.length - 1];

        const imageFile = {
          uri: apiData.cover_image,
          name: `cover_image.${fileType}`,
          type: `image/${fileType}`,
        } as any;

        requestFormData.append("cover_image", imageFile);
      }

      const token = await SecureStore.getItemAsync("userToken");

      const response = await axios.post(
        `${API_BASE_URL}/ajo-contributions/store`,
        requestFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );

      showLogs("create ajo response", response?.data);
      if (response?.data?.status === "success") {
        getUserProfile();
        setLoading(false);
        router.push({
          pathname: "/AjoContibutionCreated",
          params: {
            data: JSON.stringify(response?.data?.data),
          },
        });
      }

      reset();
    } catch (error: any) {
      setLoading(false);

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 422) {
          const responseErrors = error.response.data.errors || {};
          setApiErrors(responseErrors);

          const errorValues = Object.values(responseErrors);
          if (errorValues.length > 0) {
            const firstError = errorValues[0];
            const errorMessage = Array.isArray(firstError)
              ? firstError[0]
              : firstError;

            Toast.show({
              type: "error",
              text1:
                errorMessage || "Failed to select image. Please try again.",
              text2: "Opps! Something went wrong.",
              position: "top",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Please check your input and try again.",
              text2: "Opps! Something went wrong.",
              position: "top",
            });
          }
        } else if (error.response.status === 401) {
        } else {
          setError(
            error.response.data.message ||
              "Failed to create Ajo contribution. Please try again."
          );

          Toast.show({
            type: "error",
            text1:
              error.response.data.message ||
              "Failed to create Ajo contribution. Please try again.",
            text2: "Opps! Something went wrong.",
            position: "top",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1:
            "Network error or server is unavailable. Please try again later.",
          text2: "Opps! Something went wrong.",
          position: "top",
        });
      }
    }
  };

  const getErrorMessage = (key: string): string => {
    const error = apiErrors[key];
    if (!error) return "";
    return Array.isArray(error) ? error[0] : (error as string);
  };

  return (
    <>
      {loading ? (
        <LoadingComp visible />
      ) : (
        <View style={styles.container}>
          <Text style={styles.title}>Create Ajo Contribution</Text>
          <KAScrollView>
            <Text style={styles.label}>Contribution Name</Text>
            <Controller
              control={control}
              rules={{
                required: "Contribution name is required",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    (errors.contributionName || apiErrors.name) &&
                      styles.inputError,
                  ]}
                  placeholder="House Rent"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="contributionName"
            />
            {errors.contributionName && (
              <Text style={styles.errorText}>
                {errors.contributionName.message}
              </Text>
            )}
            {apiErrors.name && (
              <Text style={styles.errorText}>{getErrorMessage("name")}</Text>
            )}

            <Text style={styles.label}>Description</Text>
            <Controller
              control={control}
              rules={{
                required: "Description is required",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    (errors.description || apiErrors.description) &&
                      styles.inputError,
                  ]}
                  placeholder="Enter description"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="description"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}
            {apiErrors.description && (
              <Text style={styles.errorText}>
                {getErrorMessage("description")}
              </Text>
            )}

            <Text style={styles.label}>Type of Contribution</Text>
            <Controller
              control={control}
              rules={{
                validate: (value) =>
                  value !== "Select Type" || "Please select a type",
              }}
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    ((value === "Select Type" && errors.type) ||
                      apiErrors.type) &&
                      styles.inputError,
                  ]}
                  onPress={() => setShowReasonModal(true)}
                >
                  <Text>{value}</Text>
                  <AntDesign name="down" size={15} />
                </TouchableOpacity>
              )}
              name="type"
            />
            {errors.type && (
              <Text style={styles.errorText}>{errors.type.message}</Text>
            )}
            {apiErrors.type && (
              <Text style={styles.errorText}>{getErrorMessage("type")}</Text>
            )}

            <Modal
              transparent={true}
              visible={showReasonModal}
              onRequestClose={() => setShowReasonModal(false)}
            >
              <Pressable
                style={styles.modalBackground}
                onPress={() => setShowReasonModal(false)}
              >
                <View style={styles.modalContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setValue("type", "Personal Contribution");
                      setShowReasonModal(false);
                    }}
                  >
                    <Text style={styles.modalOption}>
                      Personal Contribution
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setValue("type", "Business Contribution");
                      setShowReasonModal(false);
                    }}
                  >
                    <Text style={styles.modalOption}>
                      Business Contribution
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {/* Type of Contribution */}
            <Text style={styles.label}>Contribution Frequency</Text>
            <Controller
              control={control}
              rules={{
                validate: (value) =>
                  value !== "Select frequency" || "Please select frequency",
              }}
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdown,
                    ((value === "Select frequency" && errors.frequency) ||
                      apiErrors.frequency) &&
                      styles.inputError,
                  ]}
                  onPress={() => setShowTypeModal(true)}
                >
                  <Text>{value}</Text>
                  <AntDesign name="down" size={15} />
                </TouchableOpacity>
              )}
              name="frequency"
            />
            {errors.frequency && (
              <Text style={styles.errorText}>{errors.frequency.message}</Text>
            )}
            {apiErrors.frequency && (
              <Text style={styles.errorText}>
                {getErrorMessage("frequency")}
              </Text>
            )}

            {/* Type Modal */}
            <Modal
              transparent={true}
              visible={showTypeModal}
              onRequestClose={() => setShowTypeModal(false)}
            >
              <Pressable
                style={styles.modalBackground}
                onPress={() => setShowTypeModal(false)}
              >
                <View style={styles.modalContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      setValue("frequency", "Weekly Contribution");
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalOption}>Weekly Contribution</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setValue("frequency", "Monthly Contribution");
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalOption}>Monthly Contribution</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setValue("frequency", "Yearly Contribution");
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={styles.modalOption}>Yearly Contribution</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

            {/* Amount Contributed */}
            <Text style={styles.label}>Amount Contributed</Text>
            <Controller
              control={control}
              rules={{
                required: "Amount is required",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Please enter a valid amount",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    (errors.amount || apiErrors.amount) && styles.inputError,
                  ]}
                  placeholder="N2,979,087.00"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="amount"
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount.message}</Text>
            )}
            {apiErrors.amount && (
              <Text style={styles.errorText}>{getErrorMessage("amount")}</Text>
            )}

            {/* Number of Members */}
            <Text style={styles.label}>
              Number of Members (
              {watch("type") === "Business Contribution"
                ? "Excluding You"
                : "Including You"}
              )
            </Text>
            <Controller
              control={control}
              rules={{
                required: "Number of members is required",
                pattern: {
                  value: /^[0-9]+$/,
                  message: "Please enter a valid number",
                },
                min: {
                  value: 2,
                  message: "At least 2 members are required",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    (errors.no_of_members || apiErrors.no_of_members) &&
                      styles.inputError,
                  ]}
                  placeholder="4"
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
              name="no_of_members"
            />
            {errors.no_of_members && (
              <Text style={styles.errorText}>
                {errors.no_of_members.message}
              </Text>
            )}
            {apiErrors.no_of_members && (
              <Text style={styles.errorText}>
                {getErrorMessage("no_of_members")}
              </Text>
            )}

            {/* Estimated number of rounds */}
            {/* <Text style={styles.label}>Estimated number of rounds</Text>
    <Controller
      control={control}
      rules={{
        required: 'Number of rounds is required',
        pattern: {
          value: /^[0-9]+$/,
          message: 'Please enter a valid number'
        },
        min: {
          value: 1,
          message: 'At least 1 round is required'
        }
      }}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          style={[styles.input, errors.roundCount && styles.inputError]}
          placeholder="12"
          keyboardType="numeric"
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
        />
      )}
      name="roundCount"
    />
    {errors.roundCount && (
      <Text style={styles.errorText}>{errors.roundCount.message}</Text>
    )} */}

            {/* Contribution Rotation Date */}

            <Text style={styles.label}>Start/Contribution Rotation Date</Text>
            <Controller
              control={control}
              render={({ field: { value } }) => (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.dateInput,
                    apiErrors.start_date && styles.inputError,
                  ]}
                >
                  <View style={styles.flex}>
                    <AntDesign name="calendar" size={20} />
                    <Text>
                      {typeof value === "string"
                        ? value
                        : (value as Date).toDateString()}
                    </Text>
                  </View>
                  <AntDesign name="down" size={15} />
                </TouchableOpacity>
              )}
              name="start_date"
            />
            {apiErrors.start_date && (
              <Text style={styles.errorText}>
                {getErrorMessage("start_date")}
              </Text>
            )}

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={
                  watchDate instanceof Date
                    ? watchDate
                    : new Date(watchDate || "")
                }
                mode="date"
                display="default"
                onChange={onChangeDate}
                textColor={COLORS.swiftPayBlue}
                style={{ marginBottom: 15, marginTop: -10, marginLeft: -10 }}
                minimumDate={new Date()}
              />
            )}

            {/* Upload Image */}
            <Text style={styles.label}>Upload Contribution Image</Text>
            <Controller
              control={control}
              render={({ field: { value } }) => (
                <>
                  <TouchableOpacity
                    onPress={pickImage}
                    style={[
                      styles.input,
                      apiErrors.cover_image && styles.inputError,
                    ]}
                  >
                    <Text style={styles.uploadButton}>
                      {value ? "Image Uploaded" : "Upload Image"}
                    </Text>
                  </TouchableOpacity>
                  {value && (
                    <Image
                      source={{ uri: value }}
                      style={styles.uploadedImage}
                    />
                  )}
                </>
              )}
              name="cover_image"
            />
            {apiErrors.cover_image && (
              <Text style={styles.errorText}>
                {getErrorMessage("cover_image")}
              </Text>
            )}

            <Button
              text="Create Ajo"
              onPress={handleSubmit(onSubmit)}
              classNames="mb-[50px]"
            />
          </KAScrollView>

          <Toast />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    marginTop: 40,
  },
  input: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginVertical: 10,
    marginBottom: 20,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: -15,
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateInput: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#0000FF",
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  disabledButton: {
    backgroundColor: "#9999FF",
  },
  createButtonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
  },
  uploadedImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  flex: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadButton: {
    backgroundColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    width: 120,
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  transactionPinContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },
  successModalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
  },
  modalOption: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: "center",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  successBottomSheetHeader: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 5,
  },
  otpContainer: {
    flexDirection: "row",
    marginBottom: 30,
    gap: 15,
    alignSelf: "center",
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 30,
    color: "#000",
    fontWeight: "900",
  },
  otpInputError: {
    borderColor: "red",
  },
  desc: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  icon: {
    width: 25,
    height: 25,
  },
  successIcon: {
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: "#0000ff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default AjoContributionComponent;
