import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const AutoReel: React.FC<{
    title: string;
    subtitle: string;
}> = ({ title, subtitle }) => {
    const frame = useCurrentFrame();

    const opacity = interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: "clamp",
    });

    const translateY = interpolate(frame, [0, 20], [50, 0], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "black",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: 70,
                fontWeight: 800,
            }}
        >
            <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
                {title}
            </div>
            <div style={{ marginTop: 20, fontSize: 40, opacity: 0.85 }}>
                {subtitle}
            </div>
        </AbsoluteFill>
    );
};
