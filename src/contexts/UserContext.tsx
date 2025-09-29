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

    // Check if API root is configured
    if (!process.env.REACT_APP_API_ROOT) {
      console.error("REACT_APP_API_ROOT is not configured");
      setError("API configuration error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching user data for account:", accountId);
      console.log("API Root:", process.env.REACT_APP_API_ROOT);

      // First, fetch user data
      const userResponse = await fetch(
        `${process.env.REACT_APP_API_ROOT}/users/by-hedera-account/${accountId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!userResponse.ok) {
        throw new Error(
          `Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`,
        );
      }

      const userData: UserResponse = await userResponse.json();

      if (userData.exists) {
        setUserState(userData.user);

        // Check data sync consent before showing genomic data
        try {
          const consentResponse = await fetch(
            `${process.env.REACT_APP_API_ROOT}/consent/data-sync/status/${accountId}?t=${Date.now()}`,
          );

          if (consentResponse.ok) {
            const consentData = await consentResponse.json();

            if (
              consentData.success &&
              consentData.consent &&
              consentData.consent.isActive
            ) {
              // User has consented to data sync - show genomic data
              setGenomicData(userData.genomicData);
            } else {
              // User has not consented to data sync or consent is rejected - hide genomic data
              setGenomicData(null);
            }
          } else {
            // If we can't check consent status, err on the side of caution and hide data
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

      let errorMessage = "Failed to fetch user data";
      if (err instanceof Error) {
        if (
          err.message.includes("429") ||
          err.message.includes("Too Many Requests")
        ) {
          errorMessage =
            "Rate limit exceeded. Please wait a moment and try again.";
        } else if (err.message.includes("CORS")) {
          errorMessage =
            "CORS error: Check if the backend server is running and accessible";
        } else if (err.message.includes("Failed to fetch")) {
          errorMessage =
            "Network error: Unable to connect to the backend server";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setUserState(null);
      setGenomicData(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchUser = async (retryCount = 0) => {
    try {
      await fetchUserData();
    } catch (error) {
      // If it's a rate limit error and we haven't retried too many times, wait and retry
      if (
        error instanceof Error &&
        (error.message.includes("429") ||
          error.message.includes("Too Many Requests")) &&
        retryCount < 3
      ) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(
          `Rate limit hit, retrying in ${delay}ms (attempt ${retryCount + 1})`,
        );
        setTimeout(() => {
          refetchUser(retryCount + 1);
        }, delay);
      } else {
        throw error; // Re-throw if not a rate limit error or max retries reached
      }
    }
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
    // Debounce the fetch to prevent too many calls
    const timeoutId = setTimeout(() => {
      fetchUserData();
    }, 100);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
