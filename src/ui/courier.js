"use strict"

var font_info = {size: [256, 256], cellsize: [16, 16], glyphs: {
32: {size: [0.000, 0.000], bearing: [0.000, 0.000], advance: 10.000, cellpos: [0, 0], bitmap_size: [0, 0]},
33: {size: [3.000, 11.000], bearing: [4.000, 11.000], advance: 10.000, cellpos: [16, 0], bitmap_size: [3, 11]},
34: {size: [5.000, 5.000], bearing: [3.000, 11.000], advance: 10.000, cellpos: [32, 0], bitmap_size: [5, 5]},
35: {size: [8.000, 12.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [48, 0], bitmap_size: [8, 12]},
36: {size: [6.000, 13.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [64, 0], bitmap_size: [6, 13]},
37: {size: [7.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [80, 0], bitmap_size: [7, 11]},
38: {size: [7.000, 9.000], bearing: [2.000, 9.000], advance: 10.000, cellpos: [96, 0], bitmap_size: [7, 9]},
39: {size: [3.000, 5.000], bearing: [4.000, 11.000], advance: 10.000, cellpos: [112, 0], bitmap_size: [3, 5]},
40: {size: [3.000, 13.000], bearing: [5.000, 11.000], advance: 10.000, cellpos: [128, 0], bitmap_size: [3, 13]},
41: {size: [3.000, 13.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [144, 0], bitmap_size: [3, 13]},
42: {size: [7.000, 7.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [160, 0], bitmap_size: [7, 7]},
43: {size: [9.000, 9.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [176, 0], bitmap_size: [9, 9]},
44: {size: [3.000, 5.000], bearing: [3.000, 3.000], advance: 10.000, cellpos: [192, 0], bitmap_size: [3, 5]},
45: {size: [7.000, 1.000], bearing: [1.000, 5.000], advance: 10.000, cellpos: [208, 0], bitmap_size: [7, 1]},
46: {size: [3.000, 2.000], bearing: [4.000, 2.000], advance: 10.000, cellpos: [224, 0], bitmap_size: [3, 2]},
47: {size: [9.000, 13.000], bearing: [0.000, 12.000], advance: 10.000, cellpos: [240, 0], bitmap_size: [9, 13]},
48: {size: [7.000, 11.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [0, 16], bitmap_size: [7, 11]},
49: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [16, 16], bitmap_size: [8, 12]},
50: {size: [7.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [32, 16], bitmap_size: [7, 11]},
51: {size: [7.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [48, 16], bitmap_size: [7, 11]},
52: {size: [9.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [64, 16], bitmap_size: [9, 11]},
53: {size: [7.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [80, 16], bitmap_size: [7, 11]},
54: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [96, 16], bitmap_size: [8, 11]},
55: {size: [6.000, 11.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [112, 16], bitmap_size: [6, 11]},
56: {size: [6.000, 11.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [128, 16], bitmap_size: [6, 11]},
57: {size: [6.000, 11.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [144, 16], bitmap_size: [6, 11]},
58: {size: [2.000, 8.000], bearing: [4.000, 8.000], advance: 10.000, cellpos: [160, 16], bitmap_size: [2, 8]},
59: {size: [3.000, 9.000], bearing: [3.000, 8.000], advance: 10.000, cellpos: [176, 16], bitmap_size: [3, 9]},
60: {size: [8.000, 11.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [192, 16], bitmap_size: [8, 11]},
61: {size: [8.000, 4.000], bearing: [1.000, 7.000], advance: 10.000, cellpos: [208, 16], bitmap_size: [8, 4]},
62: {size: [8.000, 11.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [224, 16], bitmap_size: [8, 11]},
63: {size: [6.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [240, 16], bitmap_size: [6, 10]},
64: {size: [7.000, 13.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [0, 32], bitmap_size: [7, 13]},
65: {size: [10.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [16, 32], bitmap_size: [10, 10]},
66: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [32, 32], bitmap_size: [8, 10]},
67: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [48, 32], bitmap_size: [8, 10]},
68: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [64, 32], bitmap_size: [9, 10]},
69: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [80, 32], bitmap_size: [8, 10]},
70: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [96, 32], bitmap_size: [8, 10]},
71: {size: [9.000, 11.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [112, 32], bitmap_size: [9, 11]},
72: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [128, 32], bitmap_size: [9, 10]},
73: {size: [7.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [144, 32], bitmap_size: [7, 10]},
74: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [160, 32], bitmap_size: [8, 10]},
75: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [176, 32], bitmap_size: [9, 10]},
76: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [192, 32], bitmap_size: [8, 10]},
77: {size: [10.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [208, 32], bitmap_size: [10, 10]},
78: {size: [8.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [224, 32], bitmap_size: [8, 10]},
79: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [240, 32], bitmap_size: [9, 10]},
80: {size: [7.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [0, 48], bitmap_size: [7, 10]},
81: {size: [9.000, 13.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [16, 48], bitmap_size: [9, 13]},
82: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [32, 48], bitmap_size: [9, 10]},
83: {size: [6.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [48, 48], bitmap_size: [6, 10]},
84: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [64, 48], bitmap_size: [9, 10]},
85: {size: [8.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [80, 48], bitmap_size: [8, 10]},
86: {size: [10.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [96, 48], bitmap_size: [10, 10]},
87: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [112, 48], bitmap_size: [9, 10]},
88: {size: [9.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [128, 48], bitmap_size: [9, 10]},
89: {size: [9.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [144, 48], bitmap_size: [9, 10]},
90: {size: [6.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [160, 48], bitmap_size: [6, 10]},
91: {size: [3.000, 13.000], bearing: [5.000, 11.000], advance: 10.000, cellpos: [176, 48], bitmap_size: [3, 13]},
92: {size: [9.000, 13.000], bearing: [0.000, 12.000], advance: 10.000, cellpos: [192, 48], bitmap_size: [9, 13]},
93: {size: [3.000, 13.000], bearing: [3.000, 11.000], advance: 10.000, cellpos: [208, 48], bitmap_size: [3, 13]},
94: {size: [7.000, 5.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [224, 48], bitmap_size: [7, 5]},
95: {size: [10.000, 1.000], bearing: [0.000, -4.000], advance: 10.000, cellpos: [240, 48], bitmap_size: [10, 1]},
96: {size: [3.000, 3.000], bearing: [4.000, 11.000], advance: 10.000, cellpos: [0, 64], bitmap_size: [3, 3]},
97: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [16, 64], bitmap_size: [8, 8]},
98: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [32, 64], bitmap_size: [8, 11]},
99: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [48, 64], bitmap_size: [8, 8]},
100: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [64, 64], bitmap_size: [8, 11]},
101: {size: [9.000, 9.000], bearing: [1.000, 9.000], advance: 10.000, cellpos: [80, 64], bitmap_size: [9, 9]},
102: {size: [7.000, 11.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [96, 64], bitmap_size: [7, 11]},
103: {size: [8.000, 11.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [112, 64], bitmap_size: [8, 11]},
104: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [128, 64], bitmap_size: [8, 11]},
105: {size: [7.000, 12.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [144, 64], bitmap_size: [7, 12]},
106: {size: [6.000, 15.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [160, 64], bitmap_size: [6, 15]},
107: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [176, 64], bitmap_size: [8, 11]},
108: {size: [7.000, 11.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [192, 64], bitmap_size: [7, 11]},
109: {size: [9.000, 8.000], bearing: [0.000, 8.000], advance: 10.000, cellpos: [208, 64], bitmap_size: [9, 8]},
110: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [224, 64], bitmap_size: [8, 8]},
111: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [240, 64], bitmap_size: [8, 8]},
112: {size: [8.000, 11.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [0, 80], bitmap_size: [8, 11]},
113: {size: [8.000, 11.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [16, 80], bitmap_size: [8, 11]},
114: {size: [7.000, 8.000], bearing: [2.000, 8.000], advance: 10.000, cellpos: [32, 80], bitmap_size: [7, 8]},
115: {size: [7.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [48, 80], bitmap_size: [7, 8]},
116: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [64, 80], bitmap_size: [8, 10]},
117: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [80, 80], bitmap_size: [8, 8]},
118: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [96, 80], bitmap_size: [8, 8]},
119: {size: [11.000, 8.000], bearing: [0.000, 8.000], advance: 10.000, cellpos: [112, 80], bitmap_size: [11, 8]},
120: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [128, 80], bitmap_size: [8, 8]},
121: {size: [10.000, 11.000], bearing: [0.000, 8.000], advance: 10.000, cellpos: [144, 80], bitmap_size: [10, 11]},
122: {size: [8.000, 8.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [160, 80], bitmap_size: [8, 8]},
123: {size: [3.000, 13.000], bearing: [3.000, 11.000], advance: 10.000, cellpos: [176, 80], bitmap_size: [3, 13]},
124: {size: [1.000, 13.000], bearing: [5.000, 11.000], advance: 10.000, cellpos: [192, 80], bitmap_size: [1, 13]},
125: {size: [3.000, 13.000], bearing: [4.000, 11.000], advance: 10.000, cellpos: [208, 80], bitmap_size: [3, 13]},
126: {size: [7.000, 3.000], bearing: [1.000, 6.000], advance: 10.000, cellpos: [224, 80], bitmap_size: [7, 3]},
160: {size: [0.000, 0.000], bearing: [0.000, 0.000], advance: 10.000, cellpos: [240, 80], bitmap_size: [0, 0]},
161: {size: [3.000, 11.000], bearing: [4.000, 8.000], advance: 10.000, cellpos: [0, 96], bitmap_size: [3, 11]},
162: {size: [6.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [16, 96], bitmap_size: [6, 10]},
163: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [32, 96], bitmap_size: [8, 10]},
164: {size: [8.000, 8.000], bearing: [1.000, 9.000], advance: 10.000, cellpos: [48, 96], bitmap_size: [8, 8]},
165: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [64, 96], bitmap_size: [9, 10]},
166: {size: [1.000, 13.000], bearing: [5.000, 11.000], advance: 10.000, cellpos: [80, 96], bitmap_size: [1, 13]},
167: {size: [8.000, 11.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [96, 96], bitmap_size: [8, 11]},
168: {size: [5.000, 1.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [112, 96], bitmap_size: [5, 1]},
169: {size: [10.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [128, 96], bitmap_size: [10, 10]},
170: {size: [5.000, 5.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [144, 96], bitmap_size: [5, 5]},
171: {size: [10.000, 9.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [160, 96], bitmap_size: [10, 9]},
172: {size: [9.000, 5.000], bearing: [0.000, 6.000], advance: 10.000, cellpos: [176, 96], bitmap_size: [9, 5]},
173: {size: [7.000, 1.000], bearing: [1.000, 5.000], advance: 10.000, cellpos: [192, 96], bitmap_size: [7, 1]},
174: {size: [10.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [208, 96], bitmap_size: [10, 10]},
175: {size: [10.000, 1.000], bearing: [0.000, 12.000], advance: 10.000, cellpos: [224, 96], bitmap_size: [10, 1]},
176: {size: [5.000, 5.000], bearing: [3.000, 12.000], advance: 10.000, cellpos: [240, 96], bitmap_size: [5, 5]},
177: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [0, 112], bitmap_size: [9, 10]},
178: {size: [4.000, 6.000], bearing: [3.000, 11.000], advance: 10.000, cellpos: [16, 112], bitmap_size: [4, 6]},
179: {size: [4.000, 6.000], bearing: [3.000, 11.000], advance: 10.000, cellpos: [32, 112], bitmap_size: [4, 6]},
180: {size: [3.000, 3.000], bearing: [4.000, 11.000], advance: 10.000, cellpos: [48, 112], bitmap_size: [3, 3]},
181: {size: [8.000, 11.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [64, 112], bitmap_size: [8, 11]},
182: {size: [8.000, 12.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [80, 112], bitmap_size: [8, 12]},
183: {size: [2.000, 2.000], bearing: [6.000, 7.000], advance: 10.000, cellpos: [96, 112], bitmap_size: [2, 2]},
184: {size: [3.000, 4.000], bearing: [4.000, 0.000], advance: 10.000, cellpos: [112, 112], bitmap_size: [3, 4]},
185: {size: [5.000, 6.000], bearing: [3.000, 11.000], advance: 10.000, cellpos: [128, 112], bitmap_size: [5, 6]},
186: {size: [5.000, 5.000], bearing: [2.000, 11.000], advance: 10.000, cellpos: [144, 112], bitmap_size: [5, 5]},
187: {size: [9.000, 9.000], bearing: [0.000, 8.000], advance: 10.000, cellpos: [160, 112], bitmap_size: [9, 9]},
188: {size: [11.000, 11.000], bearing: [0.000, 11.000], advance: 10.000, cellpos: [176, 112], bitmap_size: [11, 11]},
189: {size: [10.000, 11.000], bearing: [0.000, 11.000], advance: 10.000, cellpos: [192, 112], bitmap_size: [10, 11]},
190: {size: [10.000, 11.000], bearing: [0.000, 11.000], advance: 10.000, cellpos: [208, 112], bitmap_size: [10, 11]},
191: {size: [6.000, 11.000], bearing: [2.000, 8.000], advance: 10.000, cellpos: [224, 112], bitmap_size: [6, 11]},
192: {size: [10.000, 14.000], bearing: [0.000, 14.000], advance: 10.000, cellpos: [240, 112], bitmap_size: [10, 14]},
193: {size: [10.000, 14.000], bearing: [0.000, 14.000], advance: 10.000, cellpos: [0, 128], bitmap_size: [10, 14]},
194: {size: [10.000, 14.000], bearing: [0.000, 14.000], advance: 10.000, cellpos: [16, 128], bitmap_size: [10, 14]},
195: {size: [10.000, 13.000], bearing: [0.000, 13.000], advance: 10.000, cellpos: [32, 128], bitmap_size: [10, 13]},
196: {size: [10.000, 12.000], bearing: [0.000, 12.000], advance: 10.000, cellpos: [48, 128], bitmap_size: [10, 12]},
197: {size: [10.000, 15.000], bearing: [0.000, 15.000], advance: 10.000, cellpos: [64, 128], bitmap_size: [10, 15]},
198: {size: [9.000, 10.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [80, 128], bitmap_size: [9, 10]},
199: {size: [8.000, 14.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [96, 128], bitmap_size: [8, 14]},
200: {size: [8.000, 14.000], bearing: [1.000, 14.000], advance: 10.000, cellpos: [112, 128], bitmap_size: [8, 14]},
201: {size: [8.000, 14.000], bearing: [1.000, 14.000], advance: 10.000, cellpos: [128, 128], bitmap_size: [8, 14]},
202: {size: [8.000, 14.000], bearing: [1.000, 14.000], advance: 10.000, cellpos: [144, 128], bitmap_size: [8, 14]},
203: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [160, 128], bitmap_size: [8, 12]},
204: {size: [7.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [176, 128], bitmap_size: [7, 14]},
205: {size: [7.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [192, 128], bitmap_size: [7, 14]},
206: {size: [7.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [208, 128], bitmap_size: [7, 14]},
207: {size: [7.000, 12.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [224, 128], bitmap_size: [7, 12]},
208: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [240, 128], bitmap_size: [8, 10]},
209: {size: [8.000, 13.000], bearing: [2.000, 13.000], advance: 10.000, cellpos: [0, 144], bitmap_size: [8, 13]},
210: {size: [9.000, 14.000], bearing: [1.000, 14.000], advance: 10.000, cellpos: [16, 144], bitmap_size: [9, 14]},
211: {size: [9.000, 14.000], bearing: [1.000, 14.000], advance: 10.000, cellpos: [32, 144], bitmap_size: [9, 14]},
212: {size: [9.000, 14.000], bearing: [1.000, 14.000], advance: 10.000, cellpos: [48, 144], bitmap_size: [9, 14]},
213: {size: [9.000, 13.000], bearing: [1.000, 13.000], advance: 10.000, cellpos: [64, 144], bitmap_size: [9, 13]},
214: {size: [9.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [80, 144], bitmap_size: [9, 12]},
215: {size: [8.000, 8.000], bearing: [1.000, 9.000], advance: 10.000, cellpos: [96, 144], bitmap_size: [8, 8]},
216: {size: [10.000, 12.000], bearing: [0.000, 11.000], advance: 10.000, cellpos: [112, 144], bitmap_size: [10, 12]},
217: {size: [8.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [128, 144], bitmap_size: [8, 14]},
218: {size: [8.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [144, 144], bitmap_size: [8, 14]},
219: {size: [8.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [160, 144], bitmap_size: [8, 14]},
220: {size: [8.000, 12.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [176, 144], bitmap_size: [8, 12]},
221: {size: [9.000, 14.000], bearing: [2.000, 14.000], advance: 10.000, cellpos: [192, 144], bitmap_size: [9, 14]},
222: {size: [7.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [208, 144], bitmap_size: [7, 10]},
223: {size: [7.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [224, 144], bitmap_size: [7, 11]},
224: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [240, 144], bitmap_size: [8, 12]},
225: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [0, 160], bitmap_size: [8, 12]},
226: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [16, 160], bitmap_size: [8, 12]},
227: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [32, 160], bitmap_size: [8, 11]},
228: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [48, 160], bitmap_size: [8, 10]},
229: {size: [8.000, 13.000], bearing: [1.000, 13.000], advance: 10.000, cellpos: [64, 160], bitmap_size: [8, 13]},
230: {size: [9.000, 8.000], bearing: [0.000, 8.000], advance: 10.000, cellpos: [80, 160], bitmap_size: [9, 8]},
231: {size: [8.000, 12.000], bearing: [1.000, 8.000], advance: 10.000, cellpos: [96, 160], bitmap_size: [8, 12]},
232: {size: [9.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [112, 160], bitmap_size: [9, 12]},
233: {size: [9.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [128, 160], bitmap_size: [9, 12]},
234: {size: [9.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [144, 160], bitmap_size: [9, 12]},
235: {size: [9.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [160, 160], bitmap_size: [9, 10]},
236: {size: [7.000, 12.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [176, 160], bitmap_size: [7, 12]},
237: {size: [7.000, 12.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [192, 160], bitmap_size: [7, 12]},
238: {size: [7.000, 12.000], bearing: [2.000, 12.000], advance: 10.000, cellpos: [208, 160], bitmap_size: [7, 12]},
239: {size: [7.000, 10.000], bearing: [2.000, 10.000], advance: 10.000, cellpos: [224, 160], bitmap_size: [7, 10]},
240: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [240, 160], bitmap_size: [8, 11]},
241: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [0, 176], bitmap_size: [8, 11]},
242: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [16, 176], bitmap_size: [8, 12]},
243: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [32, 176], bitmap_size: [8, 12]},
244: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [48, 176], bitmap_size: [8, 12]},
245: {size: [8.000, 11.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [64, 176], bitmap_size: [8, 11]},
246: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [80, 176], bitmap_size: [8, 10]},
247: {size: [8.000, 7.000], bearing: [1.000, 9.000], advance: 10.000, cellpos: [96, 176], bitmap_size: [8, 7]},
248: {size: [9.000, 10.000], bearing: [0.000, 9.000], advance: 10.000, cellpos: [112, 176], bitmap_size: [9, 10]},
249: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [128, 176], bitmap_size: [8, 12]},
250: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [144, 176], bitmap_size: [8, 12]},
251: {size: [8.000, 12.000], bearing: [1.000, 12.000], advance: 10.000, cellpos: [160, 176], bitmap_size: [8, 12]},
252: {size: [8.000, 10.000], bearing: [1.000, 10.000], advance: 10.000, cellpos: [176, 176], bitmap_size: [8, 10]},
253: {size: [10.000, 15.000], bearing: [0.000, 12.000], advance: 10.000, cellpos: [192, 176], bitmap_size: [10, 15]},
254: {size: [8.000, 14.000], bearing: [1.000, 11.000], advance: 10.000, cellpos: [208, 176], bitmap_size: [8, 14]},
255: {size: [10.000, 13.000], bearing: [0.000, 10.000], advance: 10.000, cellpos: [224, 176], bitmap_size: [10, 13]}
}};
