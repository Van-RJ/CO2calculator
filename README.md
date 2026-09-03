# DFR0548 Brake for MakeCode

Short-brake add-on for the **DFRobot DFR0548 Micro:bit Driver Expansion Board**.

This extension depends on the official [DFRobot/pxt-motor](https://github.com/DFRobot/pxt-motor) extension, so installing this repository also loads the normal DF-Driver motor/servo blocks.

## Added blocks

- `Motor brake M1` ... `M4` — short-brakes one DC motor.
- `Motor brake all` — short-brakes all four DC motor outputs.

The existing official `Motor stop` block is unchanged and remains the coast/Hi-Z stop command.

## Hardware operation

DFR0548 uses this path:

`micro:bit -> I2C -> PCA9685 -> HR8833 -> DC motor`

The HR8833 brake state is `xIN1=1, xIN2=1`, which makes both motor outputs LOW. This extension sets both corresponding PCA9685 channels to **FULL ON**.

Motor/PCA9685 channel mapping is the same as the official DFRobot extension:

| Motor | PCA9685 channels |
|---|---|
| M1 | CH6, CH7 |
| M2 | CH4, CH5 |
| M3 | CH2, CH3 |
| M4 | CH0, CH1 |

Servo channels CH8-CH15 are not changed by `Motor brake all`.

## Install in MakeCode

1. Make this repository public on GitHub.
2. Open MakeCode for micro:bit.
3. Open **Extensions**.
4. Paste the repository URL, for example:

   `https://github.com/YOUR-USERNAME/pxt-dfr0548-brake`

5. Select the extension.

The brake blocks are added to the `motor` / **DF-Driver** namespace together with the official DFRobot blocks.

## Example

```typescript
motor.MotorRun(motor.Motors.M1, motor.Dir.CW, 255)
basic.pause(1000)

motor.motorBrake(motor.Motors.M1)
basic.pause(100)

// Release the brake and coast.
motor.motorStop(motor.Motors.M1)
```

## Notes

- Short braking can produce a large motor current at high speed. Test with a short brake time first.
- These brake blocks are intended for DC motors connected to M1-M4.
- Do not use `Motor brake all` while using those same outputs as stepper-motor phases.

## License

MIT
