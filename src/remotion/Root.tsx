import React from "react";
import { Composition } from "remotion";
import { AutoReel } from "./compositions/AutoReel";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="AutoReel"
                component={AutoReel}
                durationInFrames={30 * 10} // 10 sec
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    title: "AutoReels AI",
                    subtitle: "Generated video",
                }}
            />
        </>
    );
};
