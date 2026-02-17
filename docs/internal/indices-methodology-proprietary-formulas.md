# INTERNAL ONLY — PROPRIETARY (DO NOT PUBLISH)

This document contains proprietary methodology details (formulas, parameters, and weighting/blending logic)
for Remit-Scout indices (TEER/RCI/RVI).

- Removed from the public site on: 2026-02-16
- Public page now shows: high-level overview + NDA call-to-action

If you reintroduce any of this content to a web page, treat it as confidential material and gate it behind
appropriate authentication/entitlements and NDA terms. Do not ship it in any public client bundle.

## Synthetic Weighting Parameters (historical public defaults)

- alpha (frequency): 0.4
- beta (stability): 0.4
- gamma (recency): 0.2
- half-life: 180 min
- min days: 3
- min providers: 3
- min quotes: 500
- confidence: 0-1

### Persistence bands (tier multiplier)

- High persistence: >= 0.9  ->  1.5x
- Medium persistence: >= 0.6  ->  1.0x
- Low persistence: < 0.6  ->  0.5x

## LaTeX (historical public formulas)

### Raw weight

```tex
\begin{aligned}
w_{\text{raw}} &= \ln(1 + F)^{\alpha}\, S^{\beta}\, R^{\gamma}\, m_{\text{tier}} \\
F &= \text{quotes/hour} \\
S &= \exp\!\left(-\tfrac{1}{2} z^2\right),\quad z = \frac{\bar{r} - \tilde{r}}{\sigma_r} \\
R &= \exp(-\lambda \, t_{\text{age}}),\quad t_{\text{age}}=\text{age (minutes)}
\end{aligned}
```

### Blended weight

```tex
\begin{aligned}
w_{\text{corr}} &= \frac{w_{\text{raw}}}{\sum_j w_{\text{raw},j}} \\
\text{conf} &= \min\!\left(1, \frac{d}{30}\right)\cdot \min\!\left(1, \frac{n}{n_{\min}}\right) \\
w_{\text{final}} &= \text{conf}\cdot w_{\text{corr}} + (1 - \text{conf})\cdot w_{\text{global}}
\end{aligned}
```

### TEER

```tex
\begin{aligned}
\text{RCI}_{\text{cost}} &= \frac{f + m}{S} \\
m &= \frac{(S - f)\,(r_{\text{mid}} - r_{\text{provider}})}{r_{\text{mid}}} \\
\text{TEER} &= r_{\text{mid}}\cdot\left(1 - \text{RCI}_{\text{cost}}^{(w)}\right)
\end{aligned}
```

### RCI

```tex
\begin{aligned}
\text{RCI} &= \frac{\sum_i w_i\cdot \text{cost\_ratio}_i}{\sum_i w_i} \\
\text{cost\_ratio} &= \frac{f + m}{S}
\end{aligned}
```

### RVI

```tex
\begin{aligned}
\;r_{\text{eff}} &= \frac{(S - f)\, r_{\text{provider}}}{S} \\
\text{RVI} &= \sqrt{\operatorname{Var}_w(r_{\text{eff}})} \\
\text{RVI}_{\text{bps}} &= \frac{\text{RVI}}{\text{TEER}} \cdot 10{,}000
\end{aligned}
```

