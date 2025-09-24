import { useUser } from "../contexts/UserContext";

/**
 * Custom hook to easily access user data throughout the app
 * This provides a clean interface for components that need user information
 */
export const useUserData = () => {
  const { user, genomicData, loading, error, refetchUser, setUser } = useUser();

  return {
    // User data
    user,
    genomicData,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    fullName: user
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : "",
    iHopeId: user?.iHopeId || "",
    hederaAccountId: user?.hederaAccountId || "",
    email: user?.email || "",
    lastLoginAt: user?.lastLoginAt || "",

    // Genomic data
    condition: genomicData?.condition || "",
    findings: genomicData?.findings || "",
    clinicalStatus: genomicData?.clinicalStatus || "",
    healthStatus: genomicData?.healthStatus || "",
    dateOfBirth: genomicData?.dob || "",
    sex: genomicData?.sex || "",
    ethnicity: genomicData?.ethnicity || "",
    address: genomicData?.address || "",
    city: genomicData?.city || "",
    telephone: genomicData?.telephone || "",
    receivesBenefits: genomicData?.receivesBenefits || "",
    medicalFees: genomicData?.medicalFees || 0,
    medication: genomicData?.medication || 0,
    labServices: genomicData?.labServices || 0,

    // State
    loading,
    error,
    isUserLoaded: !!user,
    isGenomicDataLoaded: !!genomicData,

    // Actions
    refetchUser,
    setUser,
  };
};
