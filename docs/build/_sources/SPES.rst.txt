Single Pulse Electrical Stimulation
==============================================

(Sub)Cortico-(Sub)Cortico Evoked Potentials
--------------------------------------------------
.. image:: ./images/EvokedPotentials.png

.. code-block:: json

    {
        "reciprocal": {
            "chan1_chan2": {
                "response": "chan3_chan4"
            }
        },
        "samplingRate": 1000,
        "significant": {
             "chan1_chan2": 1,
        },
        "time": {
            "chan1_chan2": [-54.354406730593283]
        },
           
        "window": [
            -500,
            1500
        ],
        "zscores": {
            "chan1_chan2": {
                "n1": [
                    535,
                    10.028049634488145
                ],
                "n2": [
                    601,
                    14.02594624915977
                ],
                "p2": [
                    546,
                    -2.2825574277800249
                ],
                "flipped": 1,
                "overall": [
                    535,
                    10.028049634488145
                ]
            }
        }
    }

(Sub)Cortico-(Sub)Cortico Spectral Responses
---------------------------------------------------
.. image:: ./images/SpectralResponses.png

.. code-block:: json

    {
        "highGamma": {
            "frequencyBand": [
                70,
                110
            ],
            "samplingRate": 1000,
            "significant": [],
            "time": {
                "LAM1_LAM2": [
                    -1.9207325728872038
                ]
            },
            "window": [
                -450,
                1000
            ],
            "sscores": {
                "LAM1_LAM2": {
                    "ER": [
                        461,
                        108.36628284815538
                    ],
                    "DR": [
                        1245,
                        2.5120641548211311
                    ]
                }
            }
        },
        "lowGamma": {
            "frequencyBand": [
                20,
                55
            ],
            "samplingRate": 1000,
            "significant": [],
            "time": {
                "LAM1_LAM2": [
                    -1.9207325728872038
                ]
            },
            "window": [
                -450,
                1000
            ],
            "sscores": {
                "LAM1_LAM2": {
                    "ER": [
                        461,
                        108.36628284815538
                    ],
                    "DR": [
                        1245,
                        2.5120641548211311
                    ]
                }
            }
        }
    }
