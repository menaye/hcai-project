/**
 * HumanMascot – meet Sid, the Human.exe sloth companion
 *
 * A cute cartoon sloth inspired by friendly app mascots:
 *  - Warm tan fur with earthy gradient body
 *  - Huge eyes with distinctive dark eye-patch fur (classic sloth)
 *  - Gentle permanent smile, rosy cheeks
 *  - Long curved arms
 *  - Round ears with inner pink
 *  - Periodic blink + state animations
 *
 * States: idle | thinking | happy | encouraging
 * Sizes:  sm (64) | md (100) | lg (140)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type MascotState = 'idle' | 'thinking' | 'happy' | 'encouraging';
type MascotSize = 'sm' | 'md' | 'lg';

interface HumanMascotProps {
  state?: MascotState;
  size?: MascotSize;
}

const sizes: Record<MascotSize, number> = { sm: 64, md: 100, lg: 140 };

// Sloth color palette
const S = {
  fur: '#C89060',
  furDark: '#9B6E47',
  furLight: '#E8D0A0',
  patch: '#4A2810',     // dark rings around eyes — the sloth signature
  sclera: '#FFF8EE',
  iris: '#3E6820',      // earthy green
  pupil: '#160C04',
  nose: '#D4826A',
  mouth: '#9B6040',
  ear: '#B07848',
  innerEar: '#E09888',
  cheek: '#E8907A',
  armTip: '#8B5E38',
};

export function HumanMascot({ state = 'idle', size = 'md' }: HumanMascotProps) {
  const dim = sizes[size];
  const bobAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Gentle bob — always on
  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: -5,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    bob.start();
    return () => bob.stop();
  }, []);

  // Blink every 3–5 seconds
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2800 + Math.random() * 2200;
      timeout = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.05, duration: 80, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
        ]).start(() => scheduleBlink());
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // State-based animations
  useEffect(() => {
    if (state === 'happy') {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.12, useNativeDriver: true, damping: 6 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 9 }),
      ]).start();
    } else if (state === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 900, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [state]);

  const rotate = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  const isHappy = state === 'happy';
  const isThinking = state === 'thinking';
  const isEncouraging = state === 'encouraging';

  // Proportions
  const armLen = dim * 0.30;
  const armThick = dim * 0.10;
  const containerW = dim + armLen * 1.5;

  // Dark eye-patch sizing
  const patchW = dim * 0.22;
  const patchH = dim * 0.20;
  const patchY = dim * 0.29;
  const patchOffsetX = dim * 0.188;

  // Eye sizing (centered inside the patch)
  const eyeSize = dim * 0.125;
  const eyeY = patchY + patchH * 0.22;
  const eyeOffsetX = patchOffsetX;
  const irisSize = eyeSize * 0.64;
  const pupilSize = irisSize * 0.54;
  const highlightSize = pupilSize * 0.36;

  // Nose
  const noseW = dim * 0.10;
  const noseH = dim * 0.065;
  const noseY = dim * 0.54;

  // Mouth
  const mouthY = dim * 0.64;

  // Ear
  const earSize = dim * 0.14;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: containerW,
          height: dim * 1.1,
          transform: [
            { translateY: bobAnim },
            { scale: scaleAnim },
            { rotate },
          ],
        },
      ]}
    >
      {/* Left arm */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: dim * 0.46,
          width: armLen,
          height: armThick,
          borderRadius: armThick / 2,
          backgroundColor: S.furDark,
          transform: [{ rotate: '28deg' }],
        }}
      />
      {/* Left claw nub */}
      <View
        style={{
          position: 'absolute',
          left: armLen * 0.02,
          top: dim * 0.46 + armLen * 0.48 - armThick * 0.3,
          width: armThick * 0.7,
          height: armThick * 0.7,
          borderRadius: armThick,
          backgroundColor: S.armTip,
        }}
      />

      {/* Right arm */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: dim * 0.46,
          width: armLen,
          height: armThick,
          borderRadius: armThick / 2,
          backgroundColor: S.furDark,
          transform: [{ rotate: '-28deg' }],
        }}
      />
      {/* Right claw nub */}
      <View
        style={{
          position: 'absolute',
          right: armLen * 0.02,
          top: dim * 0.46 + armLen * 0.48 - armThick * 0.3,
          width: armThick * 0.7,
          height: armThick * 0.7,
          borderRadius: armThick,
          backgroundColor: S.armTip,
        }}
      />

      {/* Head + body (centered between arms) */}
      <View
        style={{
          position: 'absolute',
          left: armLen * 0.65,
          top: 0,
          width: dim,
          height: dim,
        }}
      >
        {/* Left ear outer */}
        <View
          style={{
            position: 'absolute',
            width: earSize,
            height: earSize,
            borderRadius: earSize / 2,
            backgroundColor: S.ear,
            top: dim * 0.03,
            left: -earSize * 0.38,
            zIndex: 0,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: earSize * 0.52,
            height: earSize * 0.52,
            borderRadius: earSize,
            backgroundColor: S.innerEar,
            top: dim * 0.03 + earSize * 0.24,
            left: -earSize * 0.38 + earSize * 0.24,
            zIndex: 0,
          }}
        />

        {/* Right ear outer */}
        <View
          style={{
            position: 'absolute',
            width: earSize,
            height: earSize,
            borderRadius: earSize / 2,
            backgroundColor: S.ear,
            top: dim * 0.03,
            right: -earSize * 0.38,
            zIndex: 0,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: earSize * 0.52,
            height: earSize * 0.52,
            borderRadius: earSize,
            backgroundColor: S.innerEar,
            top: dim * 0.03 + earSize * 0.24,
            right: -earSize * 0.38 + earSize * 0.24,
            zIndex: 0,
          }}
        />

        {/* Main head gradient */}
        <LinearGradient
          colors={[S.furLight, S.fur, S.furDark]}
          start={{ x: 0.25, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={{
            position: 'absolute',
            width: dim,
            height: dim,
            borderRadius: dim * 0.48,
            zIndex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Belly / lighter center patch */}
          <View
            style={{
              position: 'absolute',
              width: dim * 0.52,
              height: dim * 0.48,
              borderRadius: dim * 0.26,
              backgroundColor: S.furLight,
              top: dim * 0.46,
              left: dim * 0.24,
              opacity: 0.55,
            }}
          />

          {/* Left dark eye patch */}
          <View
            style={{
              position: 'absolute',
              width: patchW,
              height: patchH,
              borderRadius: patchH * 0.5,
              backgroundColor: S.patch,
              top: patchY,
              left: dim / 2 - patchOffsetX - patchW / 2,
              transform: [{ rotate: isHappy ? '-10deg' : '0deg' }],
            }}
          />
          {/* Right dark eye patch */}
          <View
            style={{
              position: 'absolute',
              width: patchW,
              height: patchH,
              borderRadius: patchH * 0.5,
              backgroundColor: S.patch,
              top: patchY,
              left: dim / 2 + patchOffsetX - patchW / 2,
              transform: [{ rotate: isHappy ? '10deg' : '0deg' }],
            }}
          />

          {/* Left eye — sclera */}
          <Animated.View
            style={{
              position: 'absolute',
              width: eyeSize,
              height: isHappy ? eyeSize * 0.68 : eyeSize,
              borderRadius: eyeSize / 2,
              backgroundColor: S.sclera,
              top: eyeY,
              left: dim / 2 - eyeOffsetX - eyeSize / 2,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scaleY: blinkAnim }],
            }}
          >
            <View
              style={{
                width: irisSize,
                height: irisSize,
                borderRadius: irisSize / 2,
                backgroundColor: S.iris,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: pupilSize,
                  height: pupilSize,
                  borderRadius: pupilSize / 2,
                  backgroundColor: S.pupil,
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 1,
                    left: 1,
                    width: highlightSize,
                    height: highlightSize,
                    borderRadius: highlightSize / 2,
                    backgroundColor: '#FFFFFF',
                    opacity: 0.92,
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Right eye — sclera */}
          <Animated.View
            style={{
              position: 'absolute',
              width: eyeSize,
              height: isHappy ? eyeSize * 0.68 : eyeSize,
              borderRadius: eyeSize / 2,
              backgroundColor: S.sclera,
              top: eyeY,
              left: dim / 2 + eyeOffsetX - eyeSize / 2,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scaleY: blinkAnim }],
            }}
          >
            <View
              style={{
                width: irisSize,
                height: irisSize,
                borderRadius: irisSize / 2,
                backgroundColor: S.iris,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: pupilSize,
                  height: pupilSize,
                  borderRadius: pupilSize / 2,
                  backgroundColor: S.pupil,
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 1,
                    left: 1,
                    width: highlightSize,
                    height: highlightSize,
                    borderRadius: highlightSize / 2,
                    backgroundColor: '#FFFFFF',
                    opacity: 0.92,
                  }}
                />
              </View>
            </View>
          </Animated.View>

          {/* Nose */}
          <View
            style={{
              position: 'absolute',
              width: noseW,
              height: noseH,
              borderRadius: noseH / 2,
              backgroundColor: S.nose,
              top: noseY,
              left: dim / 2 - noseW / 2,
            }}
          />

          {/* Rosy cheeks */}
          <View
            style={{
              position: 'absolute',
              width: dim * 0.13,
              height: dim * 0.07,
              borderRadius: dim,
              top: dim * 0.52,
              left: dim * 0.07,
              backgroundColor: S.cheek,
              opacity: isHappy ? 0.5 : 0.22,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: dim * 0.13,
              height: dim * 0.07,
              borderRadius: dim,
              top: dim * 0.52,
              right: dim * 0.07,
              backgroundColor: S.cheek,
              opacity: isHappy ? 0.5 : 0.22,
            }}
          />

        </LinearGradient>

        {/* Mouth — rendered outside LinearGradient so overflow:hidden clip works correctly */}
        {isHappy ? (
          <View style={{ position: 'absolute', width: dim * 0.38, height: dim * 0.18, top: mouthY, left: dim / 2 - dim * 0.19, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', bottom: 0, width: dim * 0.38, height: dim * 0.38, borderRadius: dim * 0.19, borderWidth: dim * 0.032, borderColor: S.mouth }} />
          </View>
        ) : isThinking ? (
          <View style={{ position: 'absolute', flexDirection: 'row', gap: dim * 0.04, top: mouthY + dim * 0.07, left: dim / 2 - dim * 0.1 }}>
            {[0, 1, 2].map((i) => (
              <ThinkingDot key={i} delay={i * 200} size={dim * 0.05} />
            ))}
          </View>
        ) : isEncouraging ? (
          <View style={{ position: 'absolute', width: dim * 0.2, height: dim * 0.13, borderRadius: dim * 0.065, backgroundColor: S.mouth, top: mouthY, left: dim / 2 - dim * 0.1, opacity: 0.85 }} />
        ) : (
          // Idle gentle smile
          <View style={{ position: 'absolute', width: dim * 0.30, height: dim * 0.13, top: mouthY, left: dim / 2 - dim * 0.15, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', bottom: 0, width: dim * 0.30, height: dim * 0.30, borderRadius: dim * 0.15, borderWidth: dim * 0.030, borderColor: S.mouth }} />
          </View>
        )}
      </View>

      {/* Shadow ellipse */}
      <View
        style={[
          styles.shadow,
          { width: dim * 0.6, marginTop: 4, alignSelf: 'center' },
        ]}
      />
    </Animated.View>
  );
}

function ThinkingDot({ delay, size }: { delay: number; size: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -4, duration: 280, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(700),
      ]),
    ).start();
  }, [delay]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: S.mouth,
        opacity: 0.8,
        transform: [{ translateY: anim }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  shadow: {
    height: 8,
    borderRadius: 8,
    backgroundColor: S.furDark,
    opacity: 0.14,
  },
});
