import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  iHopeId: string;
  firstName: string;
  lastName: string;
  email: string;
  hederaAccountId: string;
  lastLoginAt: string;
}

interface GenomicData {
  _id: string;
  wgsPatientNon: string;
  ihopeId: string;
  name: string;
  surname: string;
  sex: string;
  dob: string;
  ethnicity: string;
  designation: string;
  dateOfBleeding: string;
  referringPhysician: string;
  requestedWgs: string;
  clinicalStatus: string;
  familyMembers: string;
  resultForGeneticDisorder: string;
  findings: string;
  category: string;
  type: string;
  genomicCoordinatesSequenceVariant: number;
  cytoband: string;
  size: string;
  inheritedFrom: string;
  modeOfInheritance: string;
  interpretation: string;
  healthStatus: string;
  parentGuardianContactable: number;
  familySetup: number;
  nameOfContactableKin: string;
  email: string;
  telephone: string;
  address: string;
  suburb: string;
  city: string;
  support: number;
  receivesBenefits: string;
  email1: string;
  condition: string;
  dateOfFirstDiagnosis: string;
  grade: number;
  contact: string;
  nextOfKinContactDetails: string;
  medicalHistory: string;
  medicalFees: number;
  medication: number;
  labServices: number;
  psychologicalServices: number;
  transport: number;
  foodPack: number;
  schoolFees: number;
  chickenProject: number;
}

interface UserResponse {
  exists: boolean;
  user: User;
  genomicData: GenomicData;
}

interface UserContextType {
  user: User | null;
  genomicData: GenomicData | null;
  loading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
  setUser: (userData: UserResponse | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  accountId?: string;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  accountId,
}) => {
  const [user, setUserState] = useState<User | null>(null);
  const [genomicData, setGenomicData] = useState<GenomicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!accountId) {
      setUserState(null);
      setGenomicData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, fetch user data
      const userResponse = await fetch(
        `http://localhost:5000/api/users/by-hedera-account/${accountId}`,
      );

      if (!userResponse.ok) {
        throw new Error(
          `Failed to fetch user data: ${userResponse.statusText}`,
        );
      }

      const userData: UserResponse = await userResponse.json();

      if (userData.exists) {
        setUserState(userData.user);

        // Check data sync consent before showing genomic data
        try {
          const consentResponse = await fetch(
            `http://localhost:5000/api/consent/data-sync/status/${accountId}?t=${Date.now()}`,
          );

          if (consentResponse.ok) {
            const consentData = await consentResponse.json();

            console.log("🔍 Data sync consent status:", {
              success: consentData.success,
              hasConsent: !!consentData.consent,
              isActive: consentData.consent?.isActive,
              dbIsActive: consentData.consent?.dbIsActive,
              nftValid: consentData.consent?.nftValid,
              revokedAt: consentData.consent?.revokedAt,
            });

            if (
              consentData.success &&
              consentData.consent &&
              consentData.consent.isActive
            ) {
              // User has consented to data sync - show genomic data
              console.log(
                "✅ User has data sync consent - showing genomic data",
              );
              setGenomicData(userData.genomicData);
            } else {
              // User has not consented to data sync or consent is rejected - hide genomic data
              console.log(
                "❌ User has not consented to data sync or consent is rejected - hiding genomic data",
              );
              setGenomicData(null);
            }
          } else {
            // If we can't check consent status, err on the side of caution and hide data
            console.log(
              "⚠️ Could not check data sync consent - hiding genomic data for privacy",
            );
            setGenomicData(null);
          }
        } catch (consentError) {
          console.error("Error checking data sync consent:", consentError);
          // If we can't check consent, hide genomic data for privacy
          setGenomicData(null);
        }
      } else {
        setUserState(null);
        setGenomicData(null);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user data",
      );
      setUserState(null);
      setGenomicData(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchUser = async () => {
    await fetchUserData();
  };

  const setUser = (userData: UserResponse | null) => {
    if (userData) {
      setUserState(userData.user);
      setGenomicData(userData.genomicData);
    } else {
      setUserState(null);
      setGenomicData(null);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [accountId]);

  const value: UserContextType = {
    user,
    genomicData,
    loading,
    error,
    refetchUser,
    setUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
