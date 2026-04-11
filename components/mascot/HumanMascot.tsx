/**
 * HumanMascot – the Human.exe companion character
 *
 * A simple, friendly blob character inspired by the rough UI sketches.
 * Rendered with pure React Native shapes (no external image needed),
 * so it works immediately on all platforms without asset bundling.
 *
 * States:
 *  - idle: neutral, present
 *  - thinking: small animation hint (loading)
 *  - happy: celebrating a step completion
 *  - encouraging: supportive nudge
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../../constants/colors';

type MascotState = 'idle' | 'thinking' | 'happy' | 'encouraging';
type MascotSize = 'sm' | 'md' | 'lg';

interface HumanMascotProps {
  state?: MascotState;
  size?: MascotSize;
}

const sizes: Record<MascotSize, number> = { sm: 64, md: 100, lg: 140 };

export function HumanMascot({ state = 'idle', size = 'md' }: HumanMascotProps) {
  const dim = sizes[size];
  const bobAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle bob animation — always on
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -6,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    bob.start();
    return () => bob.stop();
  }, []);

  useEffect(() => {
    if (state === 'happy') {
      // Bounce when happy
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.18, useNativeDriver: true, damping: 6 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 8 }),
      ]).start();
    } else if (state === 'thinking') {
      // Gentle tilt
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 800, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [state]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  // Eye style varies by state
  const isHappy = state === 'happy';
  const isThinking = state === 'thinking';

  const eyeSize = dim * 0.11;
  const eyeY = dim * 0.38;
  const eyeOffsetX = dim * 0.18;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: dim,
          height: dim * 1.05,
          transform: [
            { translateY: bobAnim },
            { scale: scaleAnim },
            { rotate: rotate },
          ],
        },
      ]}
    >
      {/* Body – soft rounded blob */}
      <View
        style={[
          styles.body,
          {
            width: dim,
            height: dim,
            borderRadius: dim * 0.48,
            backgroundColor: Colors.primary,
          },
        ]}
      >
        {/* Left eye */}
        <View
          style={[
            styles.eye,
            {
              width: eyeSize,
              height: isHappy ? eyeSize * 0.6 : eyeSize,
              borderRadius: eyeSize,
              backgroundColor: Colors.surface,
              top: eyeY,
              left: dim / 2 - eyeOffsetX - eyeSize / 2,
            },
          ]}
        >
          {/* Pupil */}
          <View
            style={[
              styles.pupil,
              {
                width: eyeSize * 0.45,
                height: eyeSize * 0.45,
                borderRadius: eyeSize,
                backgroundColor: Colors.textPrimary,
                top: isHappy ? eyeSize * 0.05 : eyeSize * 0.25,
                left: eyeSize * 0.25,
              },
            ]}
          />
        </View>

        {/* Right eye */}
        <View
          style={[
            styles.eye,
            {
              width: eyeSize,
              height: isHappy ? eyeSize * 0.6 : eyeSize,
              borderRadius: eyeSize,
              backgroundColor: Colors.surface,
              top: eyeY,
              left: dim / 2 + eyeOffsetX - eyeSize / 2,
            },
          ]}
        >
          <View
            style={[
              styles.pupil,
              {
                width: eyeSize * 0.45,
                height: eyeSize * 0.45,
                borderRadius: eyeSize,
                backgroundColor: Colors.textPrimary,
                top: isHappy ? eyeSize * 0.05 : eyeSize * 0.25,
                left: eyeSize * 0.25,
              },
            ]}
          />
        </View>

        {/* Mouth */}
        {isHappy ? (
          /* Smile arc */
          <View
            style={{
              position: 'absolute',
              width: dim * 0.28,
              height: dim * 0.14,
              borderBottomLeftRadius: dim * 0.14,
              borderBottomRightRadius: dim * 0.14,
              borderWidth: dim * 0.035,
              borderTopWidth: 0,
              borderColor: Colors.surface,
              top: dim * 0.56,
              left: dim * 0.5 - dim * 0.14,
            }}
          />
        ) : isThinking ? (
          /* Neutral squiggly */
          <View
            style={{
              position: 'absolute',
              width: dim * 0.22,
              height: dim * 0.025,
              backgroundColor: Colors.surface,
              borderRadius: dim,
              top: dim * 0.6,
              left: dim * 0.5 - dim * 0.11,
              opacity: 0.8,
            }}
          />
        ) : (
          /* Default slight smile */
          <View
            style={{
              position: 'absolute',
              width: dim * 0.2,
              height: dim * 0.1,
              borderBottomLeftRadius: dim * 0.1,
              borderBottomRightRadius: dim * 0.1,
              borderWidth: dim * 0.03,
              borderTopWidth: 0,
              borderColor: Colors.surface,
              top: dim * 0.58,
              left: dim * 0.5 - dim * 0.1,
              opacity: 0.9,
            }}
          />
        )}

        {/* Cheek blush (happy state) */}
        {isHappy && (
          <>
            <View style={[styles.blush, {
              width: dim * 0.14,
              height: dim * 0.07,
              borderRadius: dim,
              top: dim * 0.54,
              left: dim * 0.14,
              backgroundColor: Colors.accent,
              opacity: 0.35,
            }]} />
            <View style={[styles.blush, {
              width: dim * 0.14,
              height: dim * 0.07,
              borderRadius: dim,
              top: dim * 0.54,
              right: dim * 0.14,
              backgroundColor: Colors.accent,
              opacity: 0.35,
            }]} />
          </>
        )}

        {/* Thinking dots */}
        {isThinking && (
          <View style={{
            position: 'absolute',
            flexDirection: 'row',
            gap: dim * 0.04,
            top: dim * 0.58,
            left: dim * 0.5 - dim * 0.12,
          }}>
            {[0, 1, 2].map((i) => (
              <ThinkingDot key={i} delay={i * 200} size={dim * 0.045} />
            ))}
          </View>
        )}
      </View>

      {/* Shadow */}
      <View style={[styles.shadow, { width: dim * 0.7, marginTop: 4 }]} />
    </Animated.View>
  );
}

function ThinkingDot({ delay, size }: { delay: number; size: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -4, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]),
    ).start();
  }, [delay]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size,
        backgroundColor: Colors.surface,
        opacity: 0.8,
        transform: [{ translateY: anim }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  body: {
    position: 'relative',
    overflow: 'hidden',
  },
  eye: {
    position: 'absolute',
    overflow: 'hidden',
  },
  pupil: {
    position: 'absolute',
  },
  blush: {
    position: 'absolute',
  },
  shadow: {
    height: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    alignSelf: 'center',
  },
});
