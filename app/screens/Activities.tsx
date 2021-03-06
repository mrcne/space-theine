import { useNavigation } from "@react-navigation/native"
import React, { useContext, useEffect, useReducer, useRef, useState } from "react"
import { View, Platform, Image, ViewStyle, TextStyle, ImageStyle, SafeAreaView } from "react-native"
import { Button, Header, Screen, Text, TextField, Wallpaper } from "../components"
import { color, spacing, typography } from "../theme"
import { Input, Slider } from 'react-native-elements';
import { theme } from "@storybook/react-native/dist/preview/components/Shared/theme"
import { stateContext } from "../comp/state"
import { DateTime, Duration } from "luxon"
import { Activity } from "../services/calculator/phase-shift-calculator"
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { activityColor, activityIcon, activityTitle } from "../utils/activity"

const FULL: ViewStyle = { flex: 1 }
const CONTAINER: ViewStyle = {
  backgroundColor: color.transparent,
  paddingHorizontal: spacing[4],
}
const TEXT: TextStyle = {
  color: color.palette.white,
  fontFamily: typography.primary,
}
const BOLD: TextStyle = { fontWeight: "bold" }
const HEADER: TextStyle = {
  backgroundColor: color.primaryDarker,
  paddingTop: spacing[3] + (Platform.OS !== "android" ? 10 : 0),
  paddingBottom: spacing[3],
  paddingHorizontal: spacing[4],
}
const HEADER_TITLE: TextStyle = {
  ...TEXT,
  ...BOLD,
  color: color.textAlternative,
  fontSize: 12,
  lineHeight: 15,
  textAlign: "center",
  letterSpacing: 1.5,
}

const ACTIVITY_BOX: ViewStyle = {
  padding: 20,
  paddingBottom: 20,
  marginVertical: 6,
  borderRadius: 5,
  shadowColor: "#000000",
  shadowRadius: 5,
  shadowOpacity: 0.5,
  shadowOffset: { width: 5, height: 5 },
  flexDirection: 'row',
}

const ACTIVITY_CONTAINER: ViewStyle = {
  ...CONTAINER,
  paddingVertical: 12,
}

function ActivityBox({ activity }: { activity: Activity }) {
  const ref = useRef<any>(0);
  const [, forceUpdate] = useReducer(n => n+1, 0);

  useEffect(() => {
      ref.current = setInterval(forceUpdate, 1000 * 60);
      return () => clearInterval(ref.current);
  }, []);

  const title = activityTitle(activity.type);
  const color = activityColor(activity.type);
  const icon = activityIcon(activity.type);

  let diffNow = activity.startTime.diffNow().plus({ seconds: 0, minutes: 0, hours: 0, days: 0, weeks: 0 }).normalize();
  let duration = activity.duration.plus({ seconds: 0, minutes: 0, hours: 0, days: 0, weeks: 0 }).normalize();
  let durationMessage = makeEndTimeMessage(activity.startTime, duration);

  return (
    <View style={{...ACTIVITY_BOX, backgroundColor: color}}>
      <View style={{flex: 1}}>
        <Text style={{color: 'white'}}>{title}</Text>
        <Text style={{color: 'white'}}>
          <FontAwesome5 name="clock" size={14} color="white" />&nbsp;
          {makeStartTimeMessage(diffNow)}
        </Text>
        {durationMessage !== null ? (<>
          <Text style={{color: 'white'}}></Text>
          <Text style={{color: 'white'}}></Text>
          <Text style={{color: 'white'}}>
            <FontAwesome5 name="ruler" size={11} color="white" />&nbsp;
            {durationMessage}
          </Text>
        </>) : (null)}
      </View>
      <View style={{justifyContent: 'center'}}>
        {icon}
      </View>
    </View>
  )
}

export function Activities() {
  const navigation = useNavigation()
  const [state, update] = useContext(stateContext);

  return (
    <View style={FULL}>
      <Wallpaper />
      <Header
        style={HEADER}
        titleStyle={HEADER_TITLE}
        leftIcon="ios-arrow-back"
        rightIcon="md-calendar"
        headerText="SPACE THEINE"
        onLeftPress={() => navigation.navigate('input1')}
        onRightPress={() => navigation.navigate('calendar')}
      />
      <Screen style={ACTIVITY_CONTAINER} preset="scroll" backgroundColor={color.transparent}>
        {state.activities.map((a, i) => (
          <ActivityBox activity={a} key={i} />
        ))}
        <Text style={{color: 'black'}}>DEBUG: {JSON.stringify(state)}</Text>
      </Screen>
    </View>
  )
}


function makeStartTimeMessage(d: Duration): string {
  if (d.weeks > 0) {
    if (d.days > 0) {
      return `in ${writeCount('week', d.weeks)} and ${writeCount('day', d.days)}`;
    } else {
      return `in ${writeCount('week', d.weeks)}`
    }
  }
  else if (d.days > 0) {
    if (d.hours > 0) {
      return `in ${writeCount('day', d.days)} and ${writeCount('hour', d.hours)}`;
    } else {
      return `in ${writeCount('day', d.days)}`
    }
  }
  else if (d.hours > 0) {
    if (d.minutes > 0) {
      return `in ${writeCount('hour', d.hours)} and ${writeCount('minute', d.minutes)}`;
    } else {
      return `in ${writeCount('hour', d.hours)}`
    }
  }
  else if (d.minutes > 0) {
    return `in ${writeCount('minute', d.minutes)}`;
  }


  else if (d.minutes === 0) {
    return 'just now';
  }


  else if (d.weeks < 0) {
    if (d.days < 0) {
      return `${writeCount('week', d.weeks)} and ${writeCount('day', d.days)} ago`;
    } else {
      return `${writeCount('week', d.weeks)} ago`
    }
  }
  else if (d.days < 0) {
    if (d.hours < 0) {
      return `${writeCount('day', d.days)} and ${writeCount('hour', d.hours)} ago`;
    } else {
      return `${writeCount('day', d.days)} ago`
    }
  }
  else if (d.hours < 0) {
    if (d.minutes < 0) {
      return `${writeCount('hour', d.hours)} and ${writeCount('minute', d.minutes)} ago`;
    } else {
      return `${writeCount('hour', d.hours)} ago`
    }
  }
  else if (d.minutes < 0) {
    return `${writeCount('minute', d.minutes)} ago`;
  }

  return 'never :<';
}

function makeEndTimeMessage(startTime: DateTime, d: Duration): string | null {
  if (d.weeks > 0) {
    if (d.days > 0) {
      return `for ${writeCount('week', d.weeks)} and ${writeCount('day', d.days)}`;
    } else {
      return `for ${writeCount('week', d.weeks)}`
    }
  }
  else if (d.days > 0) {
    if (d.hours > 0) {
      return `for ${writeCount('day', d.days)} and ${writeCount('hour', d.hours)}`;
    } else {
      return `for ${writeCount('day', d.days)}`
    }
  }
  else if (d.hours > 0) {
    if (d.minutes > 0) {
      return `for ${writeCount('hour', d.hours)} and ${writeCount('minute', d.minutes)}`;
    } else {
      return `for ${writeCount('hour', d.hours)}`
    }
  }
  else if (d.minutes >= 15) {
    return `for ${writeCount('minute', d.minutes)}`;
  }

  return null;
}

function writeCount(s: string, count: number): string {
  let c = Math.abs(count);
  if (c == 1) {
    return `${c} ${s}`;
  }
  return `${c} ${s}s`;
}
