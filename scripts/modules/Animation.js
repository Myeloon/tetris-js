const createAnimationType = function(timeFunc) {
    return function(obj, prop, final, length) {

        const startTime = performance.now();
        const initial = obj[prop];

        const anim = function(currentTime) {
            if (!obj) return true;
            const time = ((currentTime - startTime) / length);
            obj[prop] = timeFunc(time, initial, final);
            if (currentTime >= startTime + length) obj[prop] = final;
            this.finished = obj[prop] === final;
        }
        anim.target = obj;
        anim.finished = false;

        return anim;

    };
};

const createLinearAnimation = createAnimationType((time, initial, final) => initial + time * (final - initial));
const createEaseAnimation = createAnimationType((time, initial, final) => initial + (Math.sin(Math.PI*(time - 0.5)) + 1) * (final - initial) / 2);
