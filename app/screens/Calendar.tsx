import { useNavigation } from "@react-navigation/native"
import React, { useContext, useEffect, useReducer, useRef, useState } from "react"
import { View, Platform, Image, ViewStyle, TextStyle, ImageStyle, SafeAreaView, StyleSheet, useWindowDimensions } from "react-native"
import { Button, Header, Screen, Text, TextField, Wallpaper } from "../components"
import { color, spacing, typography } from "../theme"
import { colors, Input, Slider } from 'react-native-elements';
import { theme } from "@storybook/react-native/dist/preview/components/Shared/theme"
import { stateContext } from "../comp/state"
import { DateTime, Duration } from "luxon"
import { Activity } from "../services/calculator/phase-shift-calculator"
import { compareDatesAsc } from "../utils/date"
import { useScreens } from "react-native-screens"
import { activityColor, activityTitle } from "../utils/activity"

const TIME_FORMAT: 12 | 24 = 12;
const EXTEND_DURATION: number = 30;

type ExtendedActivity = Activity & {
  endTime: DateTime,
  extendedDuration: Duration,
  extendedEndTime: DateTime,
  column: number,
}

const FULL: ViewStyle = { flex: 1 }
const CONTAINER: ViewStyle = {
  // backgroundColor: color.transparent,
  // paddingHorizontal: spacing[4],
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


const EVENT_BOX_WRAPPER_1: ViewStyle = {
  padding: 1,
  position: "absolute",
  left: 80,
}

const EVENT_BOX_WRAPPER_2: ViewStyle = {
  padding: 1,
  position: "absolute",
  right: 30
}

const EVENT_BOX: ViewStyle = {
  width: '100%',
  padding: 5,
  borderRadius: 5,
}

const CALENDAR_CONTAINER: ViewStyle = {
  ...CONTAINER,
  width: '100%',
  position: 'relative',
  // paddingVertical: 12,
}

const HOUR_MARKER_WRAPPER: ViewStyle = {
  display: 'flex',
  position: 'absolute',
  width: '100%',
}

const HOUR_MARKER_LINE: ViewStyle = {
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: 'gray',
  borderStyle: 'solid',
  borderLeftWidth: 250,
  borderLeftColor: 'transparent',
  borderRightWidth: 50,
  borderRightColor: 'transparent',
}

const HOUR_MARKER_TEXT: TextStyle = {
  margin: -10,
  width: 70,
  textAlign: 'right',
}

const NOW_LINE_WRAPPER: ViewStyle = {
  position: 'absolute',
  width: '100%',
}

const NOW_LINE: ViewStyle = {
  borderBottomWidth: 2,
  borderBottomColor: "#9d0085",
}

function EventBox({ duration, offset, activity }: { duration: number, offset: number, activity: ExtendedActivity }) {
  let dimensions = useWindowDimensions();

  const title = activityTitle(activity.type);
  const color = activityColor(activity.type);

  const style = (() => {
    switch (activity.column) {
      case 1: return EVENT_BOX_WRAPPER_1;
      case 2: return EVENT_BOX_WRAPPER_2;
      default: return {};
    }
  })();

  return (
    <View style={{...style, width: (dimensions.width - 110) / 2, top: offset }}>
      <View style={{...EVENT_BOX, backgroundColor: color, height: duration-2}}>
        <Text style={{color: 'white'}}>{title}</Text>
      </View>
    </View>
  )
}

function HourMarker({ hour, offset }: { hour: number, offset: number }) {
  return (
    <View style={{...HOUR_MARKER_WRAPPER, top: offset}}>
      <View style={HOUR_MARKER_LINE} />
      <Text style={HOUR_MARKER_TEXT}>{formatHour(hour)}</Text>
    </View>
  )
}

function NowLine({ startTime }: { startTime: DateTime }) {
  const ref = useRef<any>(0);
  const [, forceUpdate] = useReducer(n => n+1, 0);

  useEffect(() => {
      ref.current = setInterval(forceUpdate, 1000 * 60);
      return () => clearInterval(ref.current);
  }, []);

  let offset = Math.round(DateTime.local().diff(startTime).milliseconds/1000/60);
  return (
    <View style={{...NOW_LINE_WRAPPER, top: offset}}>
      <View style={NOW_LINE} ></View>
    </View>
  );
}

export function Calendar() {
  const navigation = useNavigation()
  const [state, update] = useContext(stateContext);

  let activities = activitiesWithColumns(state.activities);

  let firstActivity = activities[0];

  let lastActivity = activities
    .slice()
    .sort((a, b) => compareDatesAsc(a.endTime, b.endTime))[activities.length-1];

  if (firstActivity === undefined || lastActivity === undefined) {
    return <Text>Calendar is empty :(</Text>;
  }

  let hourMarkers: {
    key: string,
    hour: number,
    offset: number,
  }[] = [];

  let now = DateTime.local();

   // if first activity is later than now
  let calendarStartTime = firstActivity.startTime.diff(now).milliseconds >= 0
    ? now.startOf('hour').minus({ minutes: 30 })
    : firstActivity.startTime.startOf('hour').minus({ minutes: 30 });

  let calendarEndTime = lastActivity.endTime.endOf('hour').plus({ minutes: 30 });

  for (let time = calendarStartTime.plus({ minutes: 30 });
      calendarEndTime.diff(time).milliseconds >= 0;
      time = time.plus({ hours: 1 })) {

    hourMarkers.push({
      key: String(time),
      hour: time. hour,
      offset: Math.round(time.diff(calendarStartTime).milliseconds/1000/60),
    });
  }

  const events = activities.map(a => ({
    offset: Math.round(a.startTime.diff(calendarStartTime).milliseconds/1000/60),
    duration: Math.round(a.extendedEndTime.diff(a.startTime).milliseconds/1000/60),
    key: a.type + a.column + String(a.startTime),
    activity: a,
  }))

  let calendarHeight = Math.round(calendarEndTime.diff(calendarStartTime).milliseconds/1000/60);

  return (
    <View style={FULL}>
      <Wallpaper />
      <Header
        style={HEADER}
        titleStyle={HEADER_TITLE}
        leftIcon="ios-arrow-back"
        headerText="SPACE THEINE"
        onLeftPress={() => navigation.navigate('activities')}
      />
      <Screen style={{...CALENDAR_CONTAINER, height: calendarHeight}} preset="scroll" backgroundColor={color.transparent}>
        {hourMarkers.map(({key, hour, offset}) => (
          <HourMarker key={key} hour={hour} offset={offset} />
        ))}
        {events.map(({offset, duration, key, activity}) => (
          <EventBox key={key} activity={activity} offset={offset} duration={duration} />
        ))}
        <NowLine startTime={calendarStartTime} />
      </Screen>
    </View>
  )
}

function formatHour(hour: number): string {
  if (TIME_FORMAT === 12) {
    return `${(hour % 12) || 12} ${hour == 0 || hour > 12 ? 'PM' : 'AM'}`;
  }

  return `${hour}:00`;
}

function activitiesWithColumns(activities: Activity[]): ExtendedActivity[] {
  const activitiesOut = activities.map(a => {
    let newDuration = extendedDuration(a.duration);
    return {
      ...a,
      endTime: a.startTime.plus(a.duration),
      extendedDuration: newDuration,
      extendedEndTime: a.startTime.plus(newDuration),
      column: 0,
    };
  });

  activitiesOut.forEach((activity, i) => {
    if (activity.column !== 0) {
      return;
    }

    const collidingActivities = activitiesOut
      .slice(i + 1)
      .filter(a => a.startTime < activity.extendedEndTime);

    if (collidingActivities.length === 0) {
      activity.column = 1;
      return;
    }

    const longestCollidingActivity = collidingActivities.reduce((acc, current) => {
      return current.extendedDuration > acc.extendedDuration
        ? current
        : acc;
    });

    // activity is longer
    if (activity.extendedDuration >= longestCollidingActivity.extendedDuration) {
      activity.column = 1;
      collidingActivities.forEach(a => {
        a.column = 2;
      });
      return;
    }

    // colliding are longer, put them on column 1
    // ASSUMES COLLIDING CAN NOT COLLIDE WITH EACH OTHER
    collidingActivities.forEach(a => {
      a.column = 1;
    });
    activity.column = 2;
  });

  return activitiesOut;
}

function extendedDuration(duration: Duration): Duration {
  return duration < Duration.fromObject({ milliseconds: 1000 * 60 * EXTEND_DURATION })
    ? Duration.fromMillis(1000 * 60 * EXTEND_DURATION)
    : duration;
}
