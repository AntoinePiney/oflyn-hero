// OptimizedModelLoader.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Singleton instance pour le loader
 * @type {OptimizedModelLoader|null}
 */
let instance = null;

/**
 * Class de chargement optimisé des modèles 3D
 */
class OptimizedModelLoader {
  /**
   * Constructeur privé pour le pattern Singleton
   */
  constructor() {
    if (instance) {
      throw new Error(
        "New instance cannot be created, use OptimizedModelLoader.getInstance()"
      );
    }

    this._initializeLoaders();
    this._setupCache();
    this._bindMethods();
    this._setupEventListeners();

    // État interne
    this.loadingStates = new Map();
    this.retryDelays = [1000, 2000, 5000]; // Délais progressifs pour les retries
  }

  /**
   * Initialise les différents loaders (GLTF, DRACO, etc.)
   * @private
   */
  _initializeLoaders() {
    // Loader principal GLTF
    this.gltfLoader = new GLTFLoader();

    // Configuration DRACO avec CDN
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );
    dracoLoader.preload();
    this.gltfLoader.setDRACOLoader(dracoLoader);

    // Configuration Meshopt
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    // Loading Manager pour le suivi de progression
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader.manager = this.loadingManager;
  }

  /**
   * Configure le système de cache
   * @private
   */
  _setupCache() {
    this.modelCache = new Map();
    this.textureCache = new Map();
    this.geometryCache = new Map();
    this.materialCache = new Map();
  }

  /**
   * Lie les méthodes de classe
   * @private
   */
  _bindMethods() {
    this.load = this.load.bind(this);
    this.unload = this.unload.bind(this);
    this._onProgress = this._onProgress.bind(this);
    this._onError = this._onError.bind(this);
    this._cleanup = this._cleanup.bind(this);
  }

  /**
   * Configure les écouteurs d'événements
   * @private
   */
  _setupEventListeners() {
    window.addEventListener("beforeunload", this._cleanup);

    this.loadingManager.onProgress = this._onProgress;
    this.loadingManager.onError = this._onError;
  }

  /**
   * Obtient l'instance unique du loader
   * @returns {OptimizedModelLoader}
   */
  static getInstance() {
    if (!instance) {
      instance = new OptimizedModelLoader();
    }
    return instance;
  }

  /**
   * Charge un modèle avec gestion d'erreur et mise en cache
   * @param {string} path - Chemin du fichier modèle
   * @param {Object} options - Options de chargement
   * @returns {Promise<THREE.Group>}
   */
  async load(path, options = {}) {
    const {
      onProgress,
      onError,
      useCache = true,
      maxRetries = 3,
      optimizationLevel = "medium",
    } = options;

    try {
      // Vérifie le cache
      if (useCache && this.modelCache.has(path)) {
        return this._cloneFromCache(path);
      }

      // Configure le suivi de progression
      this.loadingStates.set(path, {
        progress: 0,
        onProgress,
        startTime: Date.now(),
      });

      // Charge le modèle avec retry
      const model = await this._loadWithRetry(path, maxRetries);

      // Optimise le modèle
      this._optimizeModel(model, optimizationLevel);

      // Met en cache si nécessaire
      if (useCache) {
        this.modelCache.set(path, model);
      }

      return model;
    } catch (error) {
      if (onError) {
        onError(error);
      }
      console.error(`Failed to load model: ${path}`, error);
      throw error;
    }
  }

  /**
   * Charge un modèle avec système de retry
   * @private
   */
  async _loadWithRetry(path, retriesLeft, attempt = 1) {
    try {
      return await new Promise((resolve, reject) => {
        this.gltfLoader.load(
          path,
          resolve,
          (event) => this._onProgress(event, path),
          reject
        );
      });
    } catch (error) {
      if (retriesLeft > 0) {
        const delay =
          this.retryDelays[attempt - 1] ||
          this.retryDelays[this.retryDelays.length - 1];
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this._loadWithRetry(path, retriesLeft - 1, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Optimise un modèle chargé
   * @private
   */
  _optimizeModel(model, level) {
    model.scene.traverse((node) => {
      if (node.isMesh) {
        // Optimisation de la géométrie
        if (node.geometry) {
          this._optimizeGeometry(node.geometry, level);
        }

        // Optimisation du matériau
        if (node.material) {
          this._optimizeMaterial(node.material, level);
        }

        // Optimisations générales du mesh
        node.frustumCulled = true;
        node.matrixAutoUpdate = false;
        node.updateMatrix();
      }
    });
  }

  /**
   * Optimise une géométrie
   * @private
   */
  _optimizeGeometry(geometry, level) {
    // Définit l'usage statique pour les buffers
    Object.values(geometry.attributes).forEach((attribute) => {
      attribute.usage = THREE.StaticDrawUsage;
    });

    if (level === "high") {
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
    }
  }

  /**
   * Optimise un matériau
   * @private
   */
  _optimizeMaterial(material, level) {
    material.precision = level === "high" ? "highp" : "mediump";

    if (material.map) {
      material.map.anisotropy = 1;
      material.map.minFilter = THREE.LinearFilter;
    }
  }

  /**
   * Clone un modèle depuis le cache
   * @private
   */
  _cloneFromCache(path) {
    const cached = this.modelCache.get(path);
    return {
      scene: cached.scene.clone(true),
      animations: cached.animations.slice(),
      asset: { ...cached.asset },
      cameras: cached.cameras.slice(),
      parser: cached.parser,
    };
  }

  /**
   * Gestionnaire de progression
   * @private
   */
  _onProgress(event, path) {
    const state = this.loadingStates.get(path);
    if (state && state.onProgress) {
      const progress = (event.loaded / event.total) * 100;
      state.progress = progress;
      state.onProgress(progress, event);
    }
  }

  /**
   * Gestionnaire d'erreur
   * @private
   */
  _onError(error) {
    console.error("Loading error:", error);
  }

  /**
   * Nettoie les ressources
   */
  unload(path) {
    if (this.modelCache.has(path)) {
      const model = this.modelCache.get(path);
      this._disposeModel(model);
      this.modelCache.delete(path);
    }
  }

  /**
   * Dispose d'un modèle et de ses ressources
   * @private
   */
  _disposeModel(model) {
    model.scene.traverse((node) => {
      if (node.isMesh) {
        node.geometry.dispose();

        if (Array.isArray(node.material)) {
          node.material.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value && typeof value.dispose === "function") {
                value.dispose();
              }
            });
          });
        } else if (node.material) {
          Object.values(node.material).forEach((value) => {
            if (value && typeof value.dispose === "function") {
              value.dispose();
            }
          });
        }
      }
    });
  }

  /**
   * Nettoyage global
   * @private
   */
  _cleanup() {
    // Nettoie tous les modèles en cache
    this.modelCache.forEach((model, path) => {
      this.unload(path);
    });

    // Supprime les écouteurs
    window.removeEventListener("beforeunload", this._cleanup);

    // Réinitialise l'instance
    instance = null;
  }
}

export default OptimizedModelLoader;
