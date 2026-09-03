/**
 * Short-brake add-on for the DFRobot DFR0548 Micro:bit Driver Expansion Board.
 *
 * This extension depends on DFRobot/pxt-motor and adds brake blocks to the
 * existing `motor` namespace / DF-Driver toolbox category.
 *
 * Hardware path:
 * micro:bit -> I2C -> PCA9685 -> HR8833 -> DC motor
 *
 * HR8833 brake state: xIN1 = H, xIN2 = H.
 */
namespace motor {
    const BRAKE_PCA9685_ADDRESS = 0x40
    const BRAKE_MODE1 = 0x00
    const BRAKE_LED0_ON_L = 0x06

    const BRAKE_MODE1_AI = 0x20
    const BRAKE_MODE1_SLEEP = 0x10
    const BRAKE_FULL_ON = 0x10

    function brakeWriteRegister(reg: number, value: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(BRAKE_PCA9685_ADDRESS, buf)
    }

    function brakeReadRegister(reg: number): number {
        pins.i2cWriteNumber(BRAKE_PCA9685_ADDRESS, reg, NumberFormat.UInt8BE)
        return pins.i2cReadNumber(BRAKE_PCA9685_ADDRESS, NumberFormat.UInt8BE)
    }

    /**
     * Make sure PCA9685 is awake and Auto-Increment is enabled.
     * We intentionally do not change the PWM frequency because FULL ON does
     * not depend on the PWM duty setting, and pxt-motor manages the normal
     * 50 Hz configuration for motor/servo operation.
     */
    function brakePreparePCA9685(): void {
        let mode1 = brakeReadRegister(BRAKE_MODE1)
        let newMode1 = (mode1 | BRAKE_MODE1_AI) & (~BRAKE_MODE1_SLEEP)

        if (newMode1 != mode1) {
            brakeWriteRegister(BRAKE_MODE1, newMode1)

            // PCA9685 datasheet: oscillator startup is at most 500 us
            // after clearing SLEEP.
            if ((mode1 & BRAKE_MODE1_SLEEP) != 0) {
                control.waitMicros(500)
            }
        }
    }

    /**
     * Set consecutive PCA9685 channels to FULL ON in one I2C transaction.
     * With the PCA9685 default OCH=0 setting, outputs update at STOP, so the
     * two HR8833 inputs for one motor are updated together.
     */
    function brakeSetFullOnRange(firstChannel: number, channelCount: number): void {
        if (firstChannel < 0 || channelCount <= 0 || firstChannel + channelCount > 16) {
            return
        }

        brakePreparePCA9685()

        let buf = pins.createBuffer(1 + channelCount * 4)
        buf[0] = BRAKE_LED0_ON_L + firstChannel * 4

        for (let i = 0; i < channelCount; i++) {
            let p = 1 + i * 4
            buf[p] = 0x00              // LEDn_ON_L
            buf[p + 1] = BRAKE_FULL_ON // LEDn_ON_H bit 4 = FULL ON
            buf[p + 2] = 0x00          // LEDn_OFF_L (ignored in FULL ON)
            buf[p + 3] = 0x00          // LEDn_OFF_H
        }

        pins.i2cWriteBuffer(BRAKE_PCA9685_ADDRESS, buf)
    }

    /**
     * Short-brake one DC motor on the DFR0548.
     * The motor remains braked until another motor command changes its inputs.
     */
    //% weight=19
    //% blockId=motor_motorBrake block="Motor brake|%index"
    //% index.fieldEditor="gridpicker" index.fieldOptions.columns=2
    export function motorBrake(index: Motors): void {
        if (index > 4 || index <= 0) {
            return
        }

        // Same channel mapping used by DFRobot/pxt-motor:
        // M1 -> CH6/7, M2 -> CH4/5, M3 -> CH2/3, M4 -> CH0/1.
        let firstChannel = (4 - index) * 2
        brakeSetFullOnRange(firstChannel, 2)
    }

    /**
     * Short-brake all four DC motor outputs simultaneously.
     * This affects PCA9685 channels 0 through 7 only; servo channels 8-15
     * are left untouched.
     */
    //% weight=9
    //% blockId=motor_motorBrakeAll block="Motor brake all"
    export function motorBrakeAll(): void {
        brakeSetFullOnRange(0, 8)
    }
}
