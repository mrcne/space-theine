import { useNavigation } from "@react-navigation/native"
import React, { useContext, useEffect } from "react"
import { TextStyle } from "react-native"
import { Text} from "../components"
import { color, typography } from "../theme"
import { stateContext } from "../comp/state"
import { calculate } from "../services/calculator/phase-shift-calculator"

const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}

export function Calculating() {
  const navigation = useNavigation();
  const [state, update] = useContext(stateContext);

  useEffect(() => {
    const { activities } = calculate({
      timeZoneDifference: state.input.timeZoneDifference,
      normalSleepingHoursStart: state.input.normalSleepingHoursStart,
      normalSleepingHoursDuration: state.input.normalSleepingHoursDuration,
    });
    update(state => ({
      ...state,
      activities,
    }));
    navigation.navigate('activities');
  }, []);


  return (
    <Text />
  )
}