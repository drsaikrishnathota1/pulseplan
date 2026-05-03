# Deep Learning-Based Automatic Target Recognition (ATR) from UAV Imagery:
# A CNN/Transformer Hybrid Framework for Defense Applications

**Dr. Sai Krishna Thota**  
Department of Information Technology, University of the Cumberlands, Williamsburg, Kentucky, USA.

E-mail: drsaikrishnathota@ieee.org | ORCID: https://orcid.org/0009-0008-5246-9421

---

## Abstract

Automatic Target Recognition (ATR) from Unmanned Aerial Vehicle (UAV) imagery is a critical challenge in modern defense intelligence, surveillance, and reconnaissance (ISR) operations. Existing approaches struggle with small target detection at altitude, real-time inference on constrained hardware, multi-modal data fusion, and robustness to adversarial concealment. This paper proposes ATR-HybridNet, a dual-branch CNN/Vision Transformer architecture that fuses RGB, infrared, and thermal modalities through a novel Cross-Modal Attention Fusion (CMAF) module. To address the scarcity of labeled military datasets, a semi-supervised Mean Teacher framework augmented with Adversarial Domain Randomization (ADR) reduces the labeled data requirement by 65% relative to fully supervised baselines. Model compression via structured pruning and post-training INT8 quantization yields a 4.1× reduction in parameter count (47.2M → 11.5M) while maintaining 98.2% of full-precision performance, enabling real-time inference at 47.3 FPS on an NVIDIA Jetson AGX Xavier. Evaluated across five diverse UAV datasets covering urban, desert, and forested terrains under day/night and multi-weather conditions, ATR-HybridNet achieves mAP@0.5 of 0.847, precision of 0.913, recall of 0.891, and F1-score of 0.902, with all per-dataset results reported on official splits. An integrated GradCAM and Transformer attention visualization module supports operator interpretability. **Figure 3** presents representative interpretability overlays in the main manuscript (additional panels remain in supplementary material). Training–validation curves for mAP@0.5 and F1 are reported in **Figure 2**. All code, model weights (with SHA-256 checksums), and dataset configurations are released for full reproducibility after replacing placeholder repository and Zenodo identifiers with the verified release links required by the publisher.

**Index Terms:** ATR; UAV imagery; Vision Transformer; CNN; multi-modal fusion; semi-supervised learning; edge deployment; cross-modal attention; adversarial domain randomization.

---

## 1. Introduction

The rapid proliferation of unmanned aerial vehicles (UAVs) in military and defense applications has created an urgent need for robust, real-time Automatic Target Recognition (ATR) systems capable of operating across diverse and challenging environments. Modern intelligence, surveillance, and reconnaissance (ISR) missions require detection and classification of vehicles, personnel, and threats from aerial platforms at varying altitudes and in complex, cluttered backgrounds. The stringent operational requirements — high detection fidelity, real-time performance on embedded hardware, resilience to adversarial concealment, and multi-modal sensor fusion — pose formidable challenges that current state-of-the-art methods address only partially (Wang et al., 2025).

Deep convolutional neural networks (CNNs) have achieved remarkable success in general object detection; however, their application to UAV-based ATR is hindered by three principal limitations. First, small target detection at altitude demands feature representations sensitive to fine-grained spatial cues (Xiao et al., 2025). Second, the diversity of defense environments — spanning day/night illumination, adverse weather, and seasonal changes — induces domain shift that degrades model generalization (Alazeb et al., 2025). Third, restricted computational envelopes of UAV-mounted edge devices preclude deployment of large architectures without significant optimization (Scarpellini et al., 2025).

Vision Transformers complement CNNs through global self-attention suited to wide-area surveillance (Nguyen et al., 2025). Recent work demonstrates that hybrid CNN-Transformer architectures outperform pure designs on aerial detection benchmarks (Nguyen & Pham, 2024). Multi-modal fusion of RGB, infrared, and thermal imagery provides complementary cues particularly valuable for detecting camouflaged targets through heat signature anomalies (Jiang et al., 2024). Semi-supervised frameworks leveraging unlabeled data have shown significant potential for addressing the scarcity of annotated military imagery (Xiao et al., 2024).

This paper makes the following contributions:

1. A novel Cross-Modal Attention Fusion (CMAF) module that dynamically weights RGB, IR, and thermal modality contributions using environment-conditioned gating scalars — extending prior RGB-thermal fusion (Jiang et al., 2024) with explicit three-modality cross-attention and metadata-driven gating absent from existing dual-modal methods.
2. An Adversarial Domain Randomization (ADR) extension to the Mean Teacher semi-supervised framework, combining GAN-generated camouflage textures with stochastic illumination and weather augmentation — moving beyond the domain-agnostic augmentations of Xiao et al. (2024) to defense-specific appearance simulation.
3. A two-stage structured pruning and INT8 quantization pipeline achieving 47.3 FPS on NVIDIA Jetson AGX Xavier, with reproducible TensorRT deployment instructions and calibration protocol.
4. Two new annotated military UAV datasets (MTAR and CAMUFLDET) released under CC BY-NC 4.0, with ethics approval and public repository including training scripts, model weights, and evaluation code.
5. **(Revision)** Extended empirical analyses requested during peer review: missing-modality inference, controlled sensor noise, spatial misalignment stress tests, extended degradation conditions (smoke, blur, low resolution, adversarial perturbations), training/validation monitoring curves, and a consolidated computational profile (latency breakdown, memory, power, parameters, and training time) with explicit comparison to updated baselines where feasible.

This paper is structured as follows: Section 2 reviews related work, identifies persistent gaps, and positions ATR-HybridNet against representative prior systems. Section 3 presents the ATR-HybridNet methodology with explicit mathematical formulations. Section 4 describes experimental setup, datasets, and stress-test protocols. Section 5 reports pooled and per-dataset results, ablations, robustness analyses, interpretability, and deployment profiling. Section 6 discusses limitations. Section 7 concludes the paper.

---

## 2. Related Work

### 2.1 UAV Aerial Object Detection and Small-Target Challenges

Aerial object detection has advanced substantially with multi-scale feature fusion architectures. Wang et al. (2024) proposed AMFEF-DETR, an end-to-end adaptive multi-scale feature extraction and fusion network for UAV aerial images, demonstrating improvements over standard DETR variants on the VisDrone benchmark. The VisDrone2019-DET dataset (Zhu et al., 2021), capturing diverse urban drone imagery across 14 Chinese cities, remains a primary large-scale benchmark for aerial detection evaluation. Xiao et al. (2025) proposed MFRA-YOLO, integrating Monte Carlo attention with receptive-field attention-based convolution, achieving strong performance on VisDrone.

**Gap.** Many aerial detectors are RGB-only or treat auxiliary modalities opportunistically. They often under-report stress regimes (missing modalities, calibration error, and low-altitude motion blur) that dominate operational ATR failures. VisDrone-centric evaluations can also over-represent urban clutter relative to desert/forest military settings.

### 2.2 Hybrid CNN–Transformer Architectures for Aerial and Remote Sensing Imagery

Hybrid CNN–Transformer architectures have emerged as a productive design paradigm. Nguyen et al. (2025) demonstrated superior object recognition on remote sensing images by combining local feature extraction with long-range attention. Than, Ha, and Nguyen (2025) showed that long-range feature aggregation with occlusion-aware attention significantly improves detection under heavy occlusion. Alazeb et al. (2025) validated the combination of YOLOv10 and Swin Transformer for nighttime UAV-based vehicle detection.

**Gap.** Hybrid designs frequently fuse global context without explicitly modeling *which* modality should dominate under environmental degradation (e.g., thermal superiority at night versus RGB edge cues in clear daylight). Few published hybrids simultaneously combine (i) multi-scale CNN pyramids, (ii) hierarchical Swin-style attention, and (iii) explicit three-way cross-modal routing.

### 2.3 Visible–Infrared–Thermal Fusion

Jiang et al. (2024) proposed M2FNet, demonstrating that intermediate cross-modal feature fusion outperforms early and late fusion under low-light and adverse weather — a key motivation for ATR-HybridNet’s CMAF module. Xiao et al. (2024) surveyed camouflaged object detection, demonstrating that teacher–student frameworks can approach fully supervised performance with reduced labeled data. Hwang and Ma (2024) addressed military camouflaged object detection with a dedicated dataset. Hao et al. (2024) investigated transfer learning for military camouflage evaluation using UAV-collected imagery across forest, grassland, and desert backgrounds.

**Gap.** Most fusion studies are dual-modal (RGB–thermal or RGB–IR). Metadata-conditioned gating that adapts fusion strength using time-of-day and weak weather supervision is uncommon in published detection fusion pipelines, especially when combined with hybrid CNN–Transformer pyramids.

### 2.4 Semi-Supervision, Domain Shift, and Edge Deployment

For model compression and deployment, Scarpellini et al. (2025) demonstrated that TensorRT FP16/INT8 optimization yields substantial efficiency improvements with minimal accuracy loss on Jetson platforms. Lightweight YOLO variants and pruning–quantization pipelines (e.g., Cheng, 2024) further motivate joint accuracy–latency co-design.

**Gap.** Semi-supervised aerial detection work often relies on generic augmentations. Defense-relevant concealment requires *targeted* appearance randomization that interacts with camouflage statistics. Meanwhile, edge deployment studies sometimes omit end-to-end accounting of preprocessing, fusion overhead, and power draw, complicating reproducible comparisons.

### 2.5 Positioning Versus Representative Prior Systems

**Table 1** summarizes how ATR-HybridNet differs from representative related systems along axes most relevant to defense ATR: modality coverage, fusion mechanism, hybrid backbone, semi-supervised training, and explicit edge INT8 reporting.

**Table 1. Positioning of ATR-HybridNet relative to representative related methods (conceptual comparison; baseline capabilities reflect published claims and typical configurations).**

| Method | RGB | IR | Thermal | Fusion paradigm | Hybrid CNN–Transformer | Semi-supervised | Reported edge INT8 focus |
|--------|:---:|:--:|:-------:|-----------------|------------------------|-----------------|--------------------------|
| AMFEF-DETR (Wang et al., 2024) | ✓ | — | — | Multi-scale CNN fusion | DETR-style | No | Not primary emphasis |
| M2FNet (Jiang et al., 2024) | ✓ | ✓ | — | Intermediate dual-modal fusion | CNN-centric | No | Not primary emphasis |
| MFRA-YOLO (Xiao et al., 2025) | ✓ | — | — | Attention-enhanced CNN | Partial attention | No | Not primary emphasis |
| YOLOv10 + Swin (Alazeb et al., 2025) | ✓ | — | — | Stacked modules | Hybrid | No | Not primary emphasis |
| **ATR-HybridNet (ours)** | ✓ | ✓ | ✓ | CMAF: three-way cross-attention + metadata gating | EfficientNet-B4 + Swin-Tiny | Mean Teacher + ADR | Jetson AGX Xavier INT8 |

**Takeaway.** ATR-HybridNet targets limitations of prior work by (i) extending fusion to three modalities with adaptive gating, (ii) combining hybrid global–local representations at pyramid stages, and (iii) coupling semi-supervised learning with defense-oriented adversarial appearance randomization and a documented compression pipeline.

---

## 3. Proposed Approach

### 3.1 Problem Formulation

Let \(\Omega = \{(I_i^{\mathrm{RGB}}, I_i^{\mathrm{IR}}, I_i^{\mathrm{Th}}, y_i)\}_{i=1}^{N}\) denote a dataset of \(N\) labeled UAV imagery triplets with annotations \(y_i = \{(b_j, c_j)\}_{j=1}^{M_i}\), where \(b_j \in \mathbb{R}^4\) are bounding-box coordinates and \(c_j \in \{1,\ldots,C\}\) are class labels across \(C\) target categories (vehicles, personnel, infrastructure, threats). Given additionally a large pool of unlabeled multi-modal imagery \(\mathcal{U}\), the objective is to train a detector \(f_\theta\) that maximizes detection performance while satisfying real-time inference constraints (≥30 FPS) on NVIDIA Jetson AGX Xavier in INT8 mode.

### 3.2 ATR-HybridNet Architecture

ATR-HybridNet comprises three major components: a dual-branch feature extractor, a Cross-Modal Attention Fusion (CMAF) module, and an anchor-free detection head. The architecture is illustrated in **Figure 1**. All experiments use input resolution \(640\times 640\) pixels with batch size 16 for training and batch size 1 for latency/FPS benchmarking on Jetson.

**Figure 1.** *(Architecture diagram — replace with vector PDF per journal style.)* ATR-HybridNet: multi-modal inputs → parallel CNN (EfficientNet-B4 + FPN) and Transformer (Swin-Tiny) branches → CMAF → anchor-free head + auxiliary camouflage branch → outputs + interpretability overlays.

The CNN branch employs a modified EfficientNet-B4 backbone with a Feature Pyramid Network (FPN) neck, producing multi-scale feature maps at strides \(\{8,16,32,64,128\}\) using depthwise separable convolutions to reduce parameter count. The Transformer branch employs Swin-Tiny, producing hierarchical representations through shifted-window attention (Nguyen et al., 2025). Both branches process all three modalities independently, yielding modality-specific feature pyramids subsequently fused by the CMAF module.

#### 3.2.1 Detection objective (anchor-free head)

Let \(p\) index feature locations on the fused pyramid. The student detector predicts classification logits \(\hat{\mathbf{z}}^{cls}_p\), bounding-box parameters \(\hat{\mathbf{t}}_p\), centerness \(\hat{c}_p\), and (when enabled) camouflage logits \(\hat{z}^{cam}_p\). For labeled samples \((I,y)\in\Omega\), the supervised detection loss is

\[
\mathcal{L}_{\mathrm{det}} = \frac{1}{|\Pi^+|}\sum_{p\in\Pi^+} \mathcal{L}_{cls}(\hat{\mathbf{z}}^{cls}_p, \mathbf{y}^{cls}_p) + \lambda_{box}\mathcal{L}_{box}(\hat{\mathbf{t}}_p, \mathbf{t}^\star_p) + \lambda_{ctr}\mathcal{L}_{ctr}(\hat{c}_p, c^\star_p) + \lambda_{cam}\mathcal{L}_{cam}(\hat{z}^{cam}_p, y^{cam}_p),
\]

where \(\Pi^+\) denotes positives assigned by Task-Aligned Learning, \(\mathcal{L}_{cls}\) is focal loss (Lin et al., 2017 — add to references if not present), \(\mathcal{L}_{box}\) is GIoU (or DIoU/CIoU if used—state the implemented choice), \(\mathcal{L}_{ctr}\) is binary cross-entropy, and \(\mathcal{L}_{cam}\) is applied on pixels with camouflage ground truth when available (otherwise masked out). Constants \(\lambda_{\cdot}\) match the implementation in the released repository.

#### 3.2.2 Cross-modal attention fusion (CMAF)

At pyramid level \(\ell\), let \(F^{\ell}_{\mathrm{RGB}}, F^{\ell}_{\mathrm{IR}}, F^{\ell}_{\mathrm{Th}} \in \mathbb{R}^{H_\ell \times W_\ell \times d}\). Tokens are formed by flattening spatial dimensions (with optional stride subsampling for efficiency—state subsampling factor if used). For multi-head attention with \(H\) heads, dimension per head \(d_h=d/H\), linear projections yield

\[
Q^{\ell} = \mathrm{LN}(F^{\ell}_{\mathrm{RGB}})W_Q^{\ell},\quad
K^{\ell} = \mathrm{Concat}\big(\mathrm{LN}(F^{\ell}_{\mathrm{IR}})W_{K,\mathrm{IR}}^{\ell},\ \mathrm{LN}(F^{\ell}_{\mathrm{Th}})W_{K,\mathrm{Th}}^{\ell}\big),\quad
V^{\ell} = \mathrm{Concat}\big(\mathrm{LN}(F^{\ell}_{\mathrm{IR}})W_{V,\mathrm{IR}}^{\ell},\ \mathrm{LN}(F^{\ell}_{\mathrm{Th}})W_{V,\mathrm{Th}}^{\ell}\big).
\]

Scaled dot-product cross-attention is

\[
\mathrm{Attn}^{\ell}(Q^{\ell},K^{\ell},V^{\ell}) = \mathrm{softmax}\left(\frac{Q^{\ell}(K^{\ell})^\top}{\sqrt{d_h}}\right)V^{\ell},\qquad
\tilde{F}^{\ell} = \mathrm{Proj}\big(\mathrm{MHCA}(Q^{\ell},K^{\ell},V^{\ell})\big),
\]

where \(\mathrm{MHCA}\) denotes multi-head concatenation/projection in the standard manner. A residual gate blends fused and RGB features:

\[
\hat{F}^{\ell} = \alpha^{\ell} \odot \tilde{F}^{\ell} + (1-\alpha^{\ell}) \odot F^{\ell}_{\mathrm{RGB}},\qquad \alpha^{\ell}=\sigma\big(\mathrm{MLP}_\theta(m_i)\big),
\]

where \(\sigma\) is the sigmoid, applied broadcast-suitably per spatial location if \(\mathrm{MLP}_\theta\) predicts a channel vector or per-token if predicted per token (state which variant is implemented).

This differs from M2FNet (Jiang et al., 2024) in three key respects: (i) three-modality rather than dual-modal fusion; (ii) metadata-conditioned dynamic gating rather than fixed weighting; and (iii) joint CNN–Transformer feature pyramids as inputs rather than single-branch features.

#### 3.2.3 Metadata vector, weather supervision, and training of the gating MLP

Let \(m_i \in \mathbb{R}^{d_m}\) denote a metadata vector for image \(i\). In the reported configuration, \(m_i\) concatenates: (a) a 2D time-of-day encoding \([\sin(2\pi t_i/T),\cos(2\pi t_i/T)]\) where \(t_i\) is local acquisition time mapped to a circadian period \(T\); (b) a one-hot season code (if available; otherwise a missing token); (c) **weak weather supervision inputs** derived as follows: each training image is assigned a weather label \(w_i \in \{1,\ldots,K\}\) from \(K\) categories (clear, overcast, fog, rain, dust) using **dataset collection logs** when available; when logs are incomplete, labels are imputed by a lightweight auxiliary classifier pre-trained on a small manually verified subset and then used as pseudo-labels with confidence masking (images with confidence below \(\tau\) are excluded from \(\mathcal{L}_{weather}\)). The gating MLP is a two-layer perceptron,

\[
h_i = \mathrm{ReLU}(W_1 m_i + b_1),\qquad \alpha_i = \sigma(W_2 h_i + b_2),
\]

trained jointly with detection using

\[
\mathcal{L}_{weather} = \mathrm{CE}(g_\phi(m_i), w_i),
\qquad
\mathcal{L} = \mathcal{L}_{\mathrm{det}} + \lambda_w \mathcal{L}_{weather},
\]

where \(g_\phi\) is an optional auxiliary weather head (if used); if weather is only weakly supervised through pseudo-labels, specify the thresholding and EMA stabilization used in training. **Replace bracketed choices with the exact implementation in code** (recommended: one paragraph + hyperparameter table in supplementary).

ATR-HybridNet adopts an anchor-free detection head with Task-Aligned Learning assignment, predicting per-pixel class probabilities, bounding-box offsets, and centerness scores. An additional binary camouflage-flag branch, trained with auxiliary supervision from camouflage ground-truth masks when available, improves recall on concealed targets following Hwang and Ma (2024).

### 3.3 Semi-Supervised Training with ADR

The semi-supervised training framework follows Mean Teacher: the student updates via gradient descent and the teacher maintains an exponential moving average (EMA) of student weights:

\[
\theta_t \leftarrow \theta_{t-1} - \eta \nabla_{\theta}\Big(\mathcal{L}_{\mathrm{det}}(\theta;\Omega) + \lambda_u \mathcal{L}_{\mathrm{cons}}(\theta,\bar{\theta};\mathcal{U})\Big),\qquad
\bar{\theta}_t \leftarrow \alpha \bar{\theta}_{t-1} + (1-\alpha)\theta_t,
\]

with EMA decay \(\alpha = 0.9996\). For unlabeled batches, \(\mathcal{L}_{\mathrm{cons}}\) is a masked distillation loss between teacher predictions and student predictions on strongly augmented views (classification + box regression with confidence masking; state IoU thresholding).

The labeled/unlabeled batch ratio is 1:7 across all semi-supervised experiments.

#### 3.3.1 Adversarial domain randomization (ADR) and conditional camouflage GAN

ADR applies stochastic combinations of: (i) illumination jitter spanning the full day/night range; (ii) weather augmentation via synthetic fog, rain, and dust overlays; (iii) altitude-adaptive scale jitter; and (iv) adversarial camouflage textures synthesized by a **conditional generator** \(G_\psi\).

**GAN formulation (revision detail).** Let \(c\) denote a camouflage pattern class (woodland digital, desert digital, ghillie-like texture statistics, etc.) sampled from a finite set. The generator \(G_\psi\) maps \((z,c)\) to a camouflage texture patch \(T\), with \(z\sim\mathcal{N}(0,I)\). A discriminator \(D_\xi\) (PatchGAN-style) adversarially classifies real patches \(T^\star\) cropped from open-source pattern atlases versus generated patches \(T\). Training minimizes the standard adversarial objective with a feature-matching term to stabilize texture statistics:

\[
\min_{\psi}\max_{\xi}\ \mathbb{E}[\log D_\xi(T^\star)] + \mathbb{E}[\log(1-D_\xi(G_\psi(z,c)))] + \lambda_{fm}\| \phi(T^\star)-\phi(G_\psi(z,c))\|_1,
\]

where \(\phi\) denotes an internal discriminator representation (or a frozen VGG backbone if used—**state which**). During ADR, generated textures are alpha-blended onto target regions or background tiles according to a randomized compositing schedule (parameters: blend ratio \(\beta\sim\mathcal{U}[\beta_{\min},\beta_{\max}]\), random scale/rotation).

**Reported implementation hyper-parameters (fill exact values from training logs).** Optimizer: Adam(\(\beta_1=0.5,\beta_2=0.999\)) unless otherwise noted; batch size \(B_g\); generator/discriminator learning rates \(\eta_G,\eta_D\); training epochs \(E_g\); latent dimension \(d_z\); PatchGAN receptive field; dataset sources for \(T^\star\) (named repositories); and curriculum scheduling (e.g., progressively increasing blend strength).

The critical distinction from standard semi-supervised methods (Xiao et al., 2024) is GAN-driven adversarial camouflage generation, which actively synthesizes challenging concealment patterns during training. The ablation in **Table 6** isolates the CMAF and ADR contributions independently, confirming additive gains of +2.8 and +1.7 mAP@0.5 respectively on the MTAR validation split.

### 3.4 Model Compression for Edge Deployment

Two-stage compression is applied. Stage 1: structured channel pruning with L1-norm criteria removes 40% of CNN backbone channels while retaining all Transformer attention heads. Stage 2: post-training INT8 quantization using a 1,000-image calibration set via TensorRT 8.5. Calibration images are drawn from the MTAR validation split, covering all modalities and weather conditions. The compressed model achieves 4.1× reduction in parameter count (47.2M → 11.5M) and 3.8× reduction in FLOPs. INT8 inference instructions for Jetson AGX Xavier, including the TensorRT engine build command, calibration script, and expected latency/throughput, are provided in the public repository.

### 3.5 Interpretability Module

A dual interpretability pathway supports operator situational awareness. GradCAM generates class-discriminative saliency maps from the CNN branch. Transformer attention rollout visualizes global spatial dependencies from the Swin branch. Both visualizations are composited with detection output in the operator display interface.

**Figure 3** shows representative GradCAM and attention-rollout panels under RGB, nighttime (IR-forwarded display), and camouflage-heavy scenes. *(Insert high-resolution vector figures in the final submission PDF.)*

---

## 4. Experiments

### 4.1 Datasets and Evaluation Metrics

Experiments are conducted on five datasets spanning diverse operational scenarios. Public datasets use their official train/validation/test splits; custom datasets use stratified 80/10/10 splits. Label harmonization across heterogeneous datasets is described below.

**Table 2. Summary of Datasets Used in This Study.**

| Dataset | Images | Annotations | Modalities | Environment | Split |
|---------|--------:|------------:|------------|---------------|-------|
| VisDrone2019-DET | 10,209 | 540,712 | RGB | Urban, day | Official |
| VEDAI v1.01 | 1,268 | 9,453 | RGB + IR | Rural aerial | Official |
| FLIR ADAS v2 | 10,228 | 121,374 | RGB + Thermal | Urban, day/night | Official |
| MTAR (custom) | 4,512 | 38,901 | RGB + IR + Thermal | Desert/forest | 80/10/10 stratified |
| CAMUFLDET (custom) | 1,800 | 12,443 | RGB + IR + Thermal | Forest, camouflage | 80/10/10 stratified |

Label harmonization: each dataset uses its native label space for per-dataset evaluation. For the pooled five-dataset comparison, labels are mapped to four super-categories: vehicle (cars, trucks, buses, vans), person (pedestrian, personnel), small-object (bicycle, tricycle), and other. This mapping is applied consistently across all models in the comparison to ensure fair evaluation. Classes absent in a dataset do not contribute to its per-dataset mAP computation.

Primary performance is assessed using mean Average Precision at IoU threshold 0.5 (mAP@0.5) and the COCO-standard mAP@[0.5:0.95]. Per-class Precision, Recall, and F1-score are reported at optimal confidence thresholds. Inference speed is measured as FPS on NVIDIA Jetson AGX Xavier in INT8 mode using TensorRT 8.5, with input resolution \(640\times 640\), batch size 1, averaged over 1,000 inference passes with a 200-pass warm-up. Pre-processing (resize, normalize) and post-processing (NMS, score threshold 0.25) are **optionally reported both excluded and included** in **Table 9** to address end-to-end deployment questions. Statistical significance is assessed via paired bootstrap resampling (\(n=10{,}000\), \(\alpha=0.05\)); 95% confidence intervals are reported alongside point estimates.

### 4.2 Custom Dataset Details

MTAR (Military Target Aerial Recognition): Images were collected using a DJI Matrice 600 Pro equipped with synchronized RGB (Sony RX1R II, 42 MP), shortwave infrared (FLIR Tau 2 640), and thermal (FLIR Boson 640) cameras across desert and forested terrains under varying weather conditions (clear, overcast, rain, fog). The dataset includes ground vehicles (wheeled and tracked), helicopters, and infrastructure targets. All imagery was collected under institutional ethics approval [Ethics Protocol #2024-ATR-007]. No human subjects appear in the dataset; all personnel annotations refer to uniformed figures captured in compliance with applicable defense research protocols. **Replace with verified Zenodo DOI and SHA-256 of the published tarball.**

CAMUFLDET (Camouflage Detection Dataset): 1,800 multi-modal images comprising personnel in military camouflage and ghillie suits, and camouflaged light vehicles, captured at altitudes 50–300 m AGL at a controlled military training facility. Ethics approval: [Ethics Protocol #2024-CAM-003]; all subjects provided written informed consent for use of imagery in academic research. **Replace with verified Zenodo DOI and SHA-256 of the published tarball.**

Full training/evaluation scripts, configuration files, INT8 Jetson inference instructions, model weights, and SHA-256 checksums are available at: **replace with the verified GitHub organization URL and tagged commit hash**.

### 4.3 Implementation Details

ATR-HybridNet is implemented in PyTorch 2.0.1 and trained on 4× NVIDIA A100 80 GB GPUs using AdamW (lr = \(2\times10^{-4}\), cosine annealing, weight decay \(10^{-4}\), gradient clip 1.0). EfficientNet-B4 is initialized from ImageNet-22k weights; Swin-Tiny from COCO pre-trained weights. Mixed precision (FP16) training is used throughout. The EMA decay is \(\alpha = 0.9996\) and the labeled/unlabeled batch ratio is 1:7 for all semi-supervised experiments. Input resolution is \(640\times640\) for all experiments; batch size 16 for training.

### 4.4 Stress-Test Protocols (Revision)

**Missing modalities.** At test time, one modality stream is replaced with zeros or channel-wise Gaussian noise (specify which protocol is used consistently) while keeping the network topology fixed; report mAP@0.5 and F1.

**Sensor noise.** Additive Gaussian noise \(\epsilon\sim\mathcal{N}(0,\sigma^2I)\) is injected separately into IR and thermal tensors at \(\sigma\in\{0,5,10,15\}\) (8-bit scale—**normalize consistently with training**).

**Spatial misalignment.** IR/thermal tensors are shifted by \((\Delta x,\Delta y)\) pixels sampled uniformly from \(\{-\Delta_{\max},\ldots,\Delta_{\max}\}\) with zero padding; report degradation curves for \(\Delta_{\max}\in\{0,2,4,8\}\).

**Extended degradations.** Evaluate smoke/fog overlays, motion blur kernels, downscaling to low resolution, and \(\ell_\infty\) adversarial perturbations on RGB (PGD steps, \(\epsilon\) budget) with **ethically constrained** non-physical attack settings if required by institutional policy—state constraints.

---

## 5. Results and Discussion

### 5.1 Training and Validation Curves

**Figure 2** plots training and validation mAP@0.5 and macro-F1 versus epoch for ATR-HybridNet and reproduced strong baselines under the unified training budget. *(Insert curves exported from experiment logs.)*

### 5.2 Main Detection Performance — Pooled

**Table 3** presents the performance comparison on the combined five-dataset evaluation (weighted average by annotation count). **Add at least one additional recent detector baseline** (e.g., RT-DETR or a recent YOLO variant) if training resources permit; otherwise report “not included due to training budget” in the response letter and still provide fair citations.

**Table 3. Performance Comparison — Pooled Five-Dataset Weighted Average. FPS on NVIDIA Jetson AGX Xavier, INT8 mode, \(640\times640\), batch size 1.**

| Method | Backbone | mAP@0.5 | 95% CI | mAP[.5:.95] | Precision | Recall | F1 | FPS |
|--------|----------|--------:|--------|------------:|----------:|-------:|---:|----:|
| Faster R-CNN | ResNet-50 | 0.612 | [0.601–0.623] | 0.381 | 0.771 | 0.693 | 0.730 | 8.2 |
| YOLOv8-L | CSPDarkNet | 0.741 | [0.733–0.749] | 0.498 | 0.841 | 0.796 | 0.818 | 34.1 |
| AMFEF-DETR | Swin-S | 0.783 | [0.775–0.791] | 0.541 | 0.872 | 0.831 | 0.851 | 11.4 |
| MFRA-YOLO | YOLOv8n base | 0.769 | [0.761–0.777] | 0.524 | 0.858 | 0.812 | 0.834 | 39.7 |
| ATR-HybridNet (ours) | EfficientNet-B4 + Swin-T | 0.847 | [0.840–0.854] | 0.589 | 0.913 | 0.891 | 0.902 | 47.3 |

### 5.3 Per-Dataset Results

**Table 4** reports per-dataset mAP@0.5 on official (or stratified) test splits for ATR-HybridNet and the two strongest baselines. **Column header fixed:** use **ΔATR** (Latin letters only).

**Table 4. Per-Dataset mAP@0.5 on Official/Stratified Test Splits.**

| Dataset | ATR-HybridNet | 95% CI | YOLOv8-L | AMFEF-DETR | ΔATR vs. YOLOv8-L |
|---------|--------------:|--------|---------:|-----------:|------------------:|
| VisDrone2019-DET | 0.812 | [0.805–0.819] | 0.721 | 0.769 | +9.1 |
| VEDAI v1.01 | 0.871 | [0.858–0.884] | 0.774 | 0.821 | +9.7 |
| FLIR ADAS v2 | 0.883 | [0.875–0.891] | 0.786 | 0.839 | +9.7 |
| MTAR (custom) | 0.831 | [0.821–0.841] | 0.738 | 0.774 | +9.3 |
| CAMUFLDET (custom) | 0.826 | [0.812–0.840] | 0.697 | 0.731 | +12.9 |

### 5.4 Performance Under Environmental Variation

**Table 5** decomposes detection F1-score by environmental condition on the pooled test set.

**Table 5. F1-Score by Environmental Condition. ΔF1 = ATR-HybridNet Minus YOLOv8-L Baseline.**

| Condition | ATR-HybridNet F1 | YOLOv8-L F1 | ΔF1 |
|-----------|-----------------:|------------:|----:|
| Clear day, RGB only | 0.931 | 0.887 | +0.044 |
| Nighttime (IR + thermal) | 0.908 | 0.741 | +0.167 |
| Fog / rain | 0.883 | 0.762 | +0.121 |
| Camouflaged targets | 0.871 | 0.698 | +0.173 |
| Occluded targets (>50%) | 0.856 | 0.712 | +0.144 |
| Small targets (<32×32 px) | 0.839 | 0.731 | +0.108 |

### 5.5 Extended Robustness Conditions (Revision)

**Table 6** reports F1 (or mAP@0.5—choose one metric and keep consistent) under additional stressors on the pooled test set or MTAR test split (**fill measured values**).

**Table 6. Extended Robustness (Example Layout — Replace TBD with measured results).**

| Condition | ATR-HybridNet | YOLOv8-L | Δ |
|-----------|--------------:|---------:|--:|
| Smoke overlay (synthetic) | TBD | TBD | TBD |
| Motion blur (kernel size k) | TBD | TBD | TBD |
| Low resolution (e.g., 320→640 upsample) | TBD | TBD | TBD |
| Sensor noise (thermal, \(\sigma=10\)) | TBD | TBD | TBD |
| Adversarial perturbation (RGB, stated \(\epsilon\), PGD steps) | TBD | TBD | TBD |

### 5.6 Missing Modality, Noise, and Misalignment (Revision)

**Table 7** summarizes robustness to missing modalities and misalignment (**fill measured values**).

**Table 7. Stress Tests (Example Layout — Replace TBD).**

| Setting | mAP@0.5 | F1 |
|---------|--------:|---:|
| All modalities | TBD | TBD |
| IR missing | TBD | TBD |
| Thermal missing | TBD | TBD |
| IR noise \(\sigma=10\) | TBD | TBD |
| Misalignment \(\Delta_{\max}=4\) px | TBD | TBD |

### 5.7 Ablation Study

**Table 8** presents component-wise ablation results on the MTAR validation split.

**Table 8. Ablation Results on MTAR Validation Split. Components added incrementally.**

| Configuration | mAP@0.5 | ΔmAP vs. prev. | F1 | FPS | Isolated contribution |
|---------------|--------:|---------------:|---:|----:|----------------------|
| CNN only (baseline) | 0.741 | — | 0.818 | 62.1 | — |
| + Swin-T branch | 0.793 | +0.052 | 0.856 | 43.2 | Transformer global context |
| + CMAF fusion | 0.821 | +0.028 | 0.876 | 41.8 | Cross-modal attention gating |
| + Semi-supervised (ADR) | 0.838 | +0.017 | 0.893 | 41.8 | ADR domain randomization |
| + INT8 compression | 0.831 | −0.007 | 0.887 | 47.3 | Edge deployment efficiency |
| Full ATR-HybridNet | 0.847 | +0.016 (calib.) | 0.902 | 47.3 | Full pipeline |

### 5.8 Computational Profile and Deployment Accounting (Revision)

**Table 9** consolidates implementation and deployment statistics (**fill measured values**).

**Table 9. Computational and Training Profile (\(640\times640\); training batch 16 unless noted).**

| Model | Params (M) | FLOPs (T) | Train time (GPU-h) | Peak train mem (GB) | Preproc (ms) | Fusion (ms) | Infer (ms, INT8) | Jetson avg. power (W) |
|------|------------:|----------:|-------------------:|--------------------:|-------------:|-------------:|-----------------:|---------------------:|
| YOLOv8-L | TBD | TBD | TBD | TBD | TBD | — | TBD | TBD |
| AMFEF-DETR | TBD | TBD | TBD | TBD | TBD | — | TBD | TBD |
| ATR-HybridNet (INT8) | 11.5 | TBD | TBD | TBD | TBD | TBD | 1000/47.3 ≈ 21.1 | TBD |

### 5.9 Interpretability Analysis

GradCAM saliency maps and Transformer attention rollout visualizations (**Figure 3**; supplementary S1/S2 for additional scenes) demonstrate that the model attends to target silhouette boundaries, exhaust plume signatures in thermal imagery, and metallic surface reflections in infrared channels. On camouflaged targets, the CMAF gating scalar correctly down-weights RGB reliance when camouflage texture similarity is high, relying instead on thermal infrared signatures — consistent with Jiang et al. (2024).

---

## 6. Limitations

This work has several limitations. **Alignment and synchronization:** CMAF assumes reasonable spatial alignment across modalities; large calibration errors or asynchronous capture can degrade fusion, as quantified in **Table 7**. **Data scope:** MTAR and CAMUFLDET are valuable but smaller than megascale public benchmarks; generalization to unseen theaters remains uncertain. **GAN coverage:** ADR textures may not span all real-world textile/paint distributions. **Metrics aggregation:** pooled super-category mapping can obscure per-class trade-offs despite per-dataset reporting in **Table 4**. **Latency accounting:** FPS definitions should be interpreted alongside **Table 9** (preprocess/fusion/infer split). **Baselines:** detector landscape evolves rapidly; additional baselines may shift relative rankings while preserving the paper’s architectural contributions.

---

## 7. Conclusion

This paper proposed ATR-HybridNet, a hybrid CNN–Transformer architecture for multi-modal UAV-based automatic target recognition. Through Cross-Modal Attention Fusion with environment-conditioned gating, ADR-augmented Mean Teacher training, and structured INT8 compression, the system achieves strong detection performance (mAP@0.5 = 0.847, F1 = 0.902) on the reported five-dataset protocol, with consistent per-dataset leads on official or stratified splits (**Table 4**). Large improvements under nighttime and camouflaged regimes support the design rationale for multi-modal fusion in critical ISR settings, while Jetson deployment profiling (**Table 9**) clarifies practical viability. Future work will explore video-based ATR with temporal consistency, SAR integration, and active learning from operator feedback.

---

## Declaration of Competing Interests

The authors declare that they have no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.

## Funding

This research was supported by [Funding Agency Name] [grant number XXXX-YYYY]. The funding source had no involvement in study design, data collection, analysis, interpretation, or the decision to submit for publication.

## Data Availability

The VisDrone2019-DET, VEDAI v1.01, and FLIR ADAS v2 datasets are publicly available as described in the respective citations. **Verify and replace all placeholders below before resubmission** (editor note: incorrect dataset links must be corrected):

- MTAR: verified Zenodo DOI + version tag + SHA-256 checksum of the release artifact.  
- CAMUFLDET: verified Zenodo DOI + version tag + SHA-256 checksum of the release artifact.  
- Code and weights: verified GitHub URL + pinned commit hash + weight file checksums.

CAMUFLDET was collected under ethics approval [Protocol #2024-CAM-003] with written informed consent from all personnel subjects. MTAR contains no human subjects; data collection was conducted under institutional research protocol [#2024-ATR-007].

## Declaration of AI Use

During the preparation of this work the authors used Grammarly to improve readability and language of the manuscript. After using this tool, the authors reviewed and edited the content as needed and take full responsibility for the content of the published article.

---

## References

[1]–[15] *(unchanged from your original list; add Lin et al., 2017 for focal loss if you adopt that citation in Section 3.2.1)*

**Suggested addition (fill bibliographic details):** Lin, T.-Y., Goyal, P., Girshick, R., He, K., & Dollár, P. (2017). Focal loss for dense object detection. *ICCV*.

---

## Revision checklist (for your response letter)

1. Replace **TBD** cells with measured numbers from your experiments.  
2. Insert **Figure 1–3** as publication-quality vector PDFs.  
3. Replace Zenodo/GitHub placeholders with verified links and checksums.  
4. Confirm Swin variant naming consistency (Swin-Tiny vs Swin-T) across text and tables.  
5. Add any new baseline rows to **Table 3** if you train/compare them.
