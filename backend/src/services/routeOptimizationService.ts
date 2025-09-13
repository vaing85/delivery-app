import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types for route optimization
export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  type: 'pickup' | 'delivery';
  orderId?: string;
  priority?: number;
  timeWindow?: {
    start: Date;
    end: Date;
  };
  estimatedDuration?: number; // in minutes
}

export interface Route {
  id: string;
  driverId: string;
  locations: Location[];
  totalDistance: number; // in kilometers
  totalDuration: number; // in minutes
  estimatedEarnings: number;
  optimized: boolean;
  algorithm: string;
  createdAt: Date;
}

export interface OptimizationResult {
  success: boolean;
  routes: Route[];
  totalDistance: number;
  totalDuration: number;
  totalEarnings: number;
  optimizationTime: number; // in milliseconds
  algorithm: string;
  improvements?: {
    distanceReduction: number;
    timeReduction: number;
    earningsIncrease: number;
  };
}

export interface OptimizationOptions {
  algorithm: 'nearest_neighbor' | 'genetic' | 'simulated_annealing' | 'ant_colony' | 'hybrid';
  maxRoutes?: number;
  maxStopsPerRoute?: number;
  timeLimit?: number; // in minutes
  considerTraffic?: boolean;
  considerTimeWindows?: boolean;
  considerDriverPreferences?: boolean;
  weightDistance?: number;
  weightTime?: number;
  weightEarnings?: number;
}

class RouteOptimizationService {
  // Main optimization method
  async optimizeRoutes(
    driverId: string,
    locations: Location[],
    options: OptimizationOptions = { algorithm: 'hybrid' }
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      let result: OptimizationResult;
      
      switch (options.algorithm) {
        case 'nearest_neighbor':
          result = await this.nearestNeighborOptimization(driverId, locations, options);
          break;
        case 'genetic':
          result = await this.geneticAlgorithmOptimization(driverId, locations, options);
          break;
        case 'simulated_annealing':
          result = await this.simulatedAnnealingOptimization(driverId, locations, options);
          break;
        case 'ant_colony':
          result = await this.antColonyOptimization(driverId, locations, options);
          break;
        case 'hybrid':
        default:
          result = await this.hybridOptimization(driverId, locations, options);
          break;
      }
      
      result.optimizationTime = Date.now() - startTime;
      
      // Save optimized routes to database
      await this.saveOptimizedRoutes(result.routes);
      
      return result;
    } catch (error) {
      console.error('Route optimization error:', error);
      return {
        success: false,
        routes: [],
        totalDistance: 0,
        totalDuration: 0,
        totalEarnings: 0,
        optimizationTime: Date.now() - startTime,
        algorithm: options.algorithm,
      };
    }
  }

  // Nearest Neighbor Algorithm
  private async nearestNeighborOptimization(
    driverId: string,
    locations: Location[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    const routes: Route[] = [];
    const maxStopsPerRoute = options.maxStopsPerRoute || 10;
    const remainingLocations = [...locations];
    
    while (remainingLocations.length > 0) {
      const routeLocations: Location[] = [];
      let currentLocation: Location | null = null;
      
      // Start with the first available location
      if (remainingLocations.length > 0) {
        currentLocation = remainingLocations.shift()!;
        routeLocations.push(currentLocation);
      }
      
      // Find nearest neighbors
      while (routeLocations.length < maxStopsPerRoute && remainingLocations.length > 0) {
        const nearest = this.findNearestLocation(currentLocation!, remainingLocations);
        if (nearest) {
          routeLocations.push(nearest);
          remainingLocations.splice(remainingLocations.indexOf(nearest), 1);
          currentLocation = nearest;
        } else {
          break;
        }
      }
      
      if (routeLocations.length > 0) {
        const route = await this.createRoute(driverId, routeLocations, 'nearest_neighbor');
        routes.push(route);
      }
    }
    
    return this.calculateOptimizationResult(routes, 'nearest_neighbor');
  }

  // Genetic Algorithm Optimization
  private async geneticAlgorithmOptimization(
    driverId: string,
    locations: Location[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.1;
    const crossoverRate = 0.8;
    
    // Initialize population
    let population = this.initializePopulation(locations, populationSize);
    
    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitnessScores = population.map(route => this.calculateFitness(route, options));
      
      // Selection
      const selected = this.selection(population, fitnessScores);
      
      // Crossover
      const offspring = this.crossover(selected, crossoverRate);
      
      // Mutation
      const mutated = this.mutation(offspring, mutationRate);
      
      // Replace population
      population = mutated;
    }
    
    // Find best solution
    const bestRoute = population.reduce((best, current) => 
      this.calculateFitness(current, options) > this.calculateFitness(best, options) ? current : best
    );
    
    const route = await this.createRoute(driverId, bestRoute, 'genetic');
    return this.calculateOptimizationResult([route], 'genetic');
  }

  // Simulated Annealing Optimization
  private async simulatedAnnealingOptimization(
    driverId: string,
    locations: Location[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    const initialTemp = 1000;
    const coolingRate = 0.95;
    const minTemp = 1;
    
    let currentSolution = this.generateRandomRoute(locations);
    let bestSolution = [...currentSolution];
    let temperature = initialTemp;
    
    while (temperature > minTemp) {
      const newSolution = this.generateNeighbor(currentSolution);
      
      const currentFitness = this.calculateFitness(currentSolution, options);
      const newFitness = this.calculateFitness(newSolution, options);
      
      if (newFitness > currentFitness || Math.random() < Math.exp((newFitness - currentFitness) / temperature)) {
        currentSolution = newSolution;
        
        if (newFitness > this.calculateFitness(bestSolution, options)) {
          bestSolution = [...newSolution];
        }
      }
      
      temperature *= coolingRate;
    }
    
    const route = await this.createRoute(driverId, bestSolution, 'simulated_annealing');
    return this.calculateOptimizationResult([route], 'simulated_annealing');
  }

  // Ant Colony Optimization
  private async antColonyOptimization(
    driverId: string,
    locations: Location[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    const numAnts = 20;
    const iterations = 50;
    const alpha = 1; // Pheromone importance
    const beta = 2; // Distance importance
    const evaporationRate = 0.1;
    const pheromoneDeposit = 1;
    
    // Initialize pheromone matrix
    const pheromones = this.initializePheromones(locations.length);
    
    let bestRoute: Location[] = [];
    let bestFitness = -Infinity;
    
    for (let iteration = 0; iteration < iterations; iteration++) {
      const antRoutes: Location[][] = [];
      
      // Each ant builds a route
      for (let ant = 0; ant < numAnts; ant++) {
        const route = this.buildAntRoute(locations, pheromones, alpha, beta);
        antRoutes.push(route);
        
        const fitness = this.calculateFitness(route, options);
        if (fitness > bestFitness) {
          bestFitness = fitness;
          bestRoute = [...route];
        }
      }
      
      // Update pheromones
      this.updatePheromones(pheromones, antRoutes, evaporationRate, pheromoneDeposit);
    }
    
    const route = await this.createRoute(driverId, bestRoute, 'ant_colony');
    return this.calculateOptimizationResult([route], 'ant_colony');
  }

  // Hybrid Optimization (combines multiple algorithms)
  private async hybridOptimization(
    driverId: string,
    locations: Location[],
    options: OptimizationOptions
  ): Promise<OptimizationResult> {
    // Start with nearest neighbor for quick initial solution
    const initialResult = await this.nearestNeighborOptimization(driverId, locations, options);
    
    // Apply genetic algorithm for improvement
    const improvedResult = await this.geneticAlgorithmOptimization(driverId, locations, {
      ...options,
      algorithm: 'genetic'
    });
    
    // Choose the better result
    const finalResult = improvedResult.totalDistance < initialResult.totalDistance ? 
      improvedResult : initialResult;
    
    finalResult.algorithm = 'hybrid';
    return finalResult;
  }

  // Helper methods
  private findNearestLocation(current: Location, candidates: Location[]): Location | null {
    if (candidates.length === 0) return null;
    
    let nearest = candidates[0];
    let minDistance = this.calculateDistance(current, nearest);
    
    for (let i = 1; i < candidates.length; i++) {
      const distance = this.calculateDistance(current, candidates[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = candidates[i];
      }
    }
    
    return nearest;
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    // Haversine formula for calculating distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateFitness(route: Location[], options: OptimizationOptions): number {
    const totalDistance = this.calculateTotalDistance(route);
    const totalTime = this.calculateTotalTime(route);
    const totalEarnings = this.calculateTotalEarnings(route);
    
    const weightDistance = options.weightDistance || 0.4;
    const weightTime = options.weightTime || 0.3;
    const weightEarnings = options.weightEarnings || 0.3;
    
    // Normalize values (higher is better)
    const distanceScore = 1 / (1 + totalDistance);
    const timeScore = 1 / (1 + totalTime);
    const earningsScore = totalEarnings / 1000; // Normalize earnings
    
    return weightDistance * distanceScore + weightTime * timeScore + weightEarnings * earningsScore;
  }

  private calculateTotalDistance(route: Location[]): number {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += this.calculateDistance(route[i], route[i + 1]);
    }
    return total;
  }

  private calculateTotalTime(route: Location[]): number {
    let total = 0;
    for (let i = 0; i < route.length; i++) {
      total += route[i].estimatedDuration || 10; // Default 10 minutes per stop
    }
    return total;
  }

  private calculateTotalEarnings(route: Location[]): number {
    // Calculate earnings based on order values
    return route.reduce((total, location) => {
      // This would be calculated based on actual order data
      return total + (location.priority || 1) * 25; // $25 per priority point
    }, 0);
  }

  private async createRoute(driverId: string, locations: Location[], algorithm: string): Promise<Route> {
    const totalDistance = this.calculateTotalDistance(locations);
    const totalDuration = this.calculateTotalTime(locations);
    const estimatedEarnings = this.calculateTotalEarnings(locations);
    
    return {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      driverId,
      locations,
      totalDistance,
      totalDuration,
      estimatedEarnings,
      optimized: true,
      algorithm,
      createdAt: new Date(),
    };
  }

  private calculateOptimizationResult(routes: Route[], algorithm: string): OptimizationResult {
    const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);
    const totalDuration = routes.reduce((sum, route) => sum + route.totalDuration, 0);
    const totalEarnings = routes.reduce((sum, route) => sum + route.estimatedEarnings, 0);
    
    return {
      success: true,
      routes,
      totalDistance,
      totalDuration,
      totalEarnings,
      optimizationTime: 0, // Will be set by caller
      algorithm,
    };
  }

  // Genetic Algorithm helpers
  private initializePopulation(locations: Location[], size: number): Location[][] {
    const population: Location[][] = [];
    
    for (let i = 0; i < size; i++) {
      const shuffled = [...locations].sort(() => Math.random() - 0.5);
      population.push(shuffled);
    }
    
    return population;
  }

  private selection(population: Location[][], fitnessScores: number[]): Location[][] {
    const selected: Location[][] = [];
    const totalFitness = fitnessScores.reduce((sum, score) => sum + score, 0);
    
    for (let i = 0; i < population.length; i++) {
      const random = Math.random() * totalFitness;
      let cumulative = 0;
      
      for (let j = 0; j < population.length; j++) {
        cumulative += fitnessScores[j];
        if (cumulative >= random) {
          selected.push([...population[j]]);
          break;
        }
      }
    }
    
    return selected;
  }

  private crossover(parents: Location[][], rate: number): Location[][] {
    const offspring: Location[][] = [];
    
    for (let i = 0; i < parents.length; i += 2) {
      if (i + 1 < parents.length && Math.random() < rate) {
        const [child1, child2] = this.orderCrossover(parents[i], parents[i + 1]);
        offspring.push(child1, child2);
      } else {
        offspring.push([...parents[i]]);
        if (i + 1 < parents.length) {
          offspring.push([...parents[i + 1]]);
        }
      }
    }
    
    return offspring;
  }

  private orderCrossover(parent1: Location[], parent2: Location[]): [Location[], Location[]] {
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * (parent1.length - start)) + start;
    
    const child1: Location[] = new Array(parent1.length);
    const child2: Location[] = new Array(parent2.length);
    
    // Copy segment from parent1 to child1
    for (let i = start; i <= end; i++) {
      child1[i] = parent1[i];
    }
    
    // Fill remaining positions from parent2
    let child1Index = 0;
    for (let i = 0; i < parent2.length; i++) {
      if (!child1.includes(parent2[i])) {
        while (child1[child1Index] !== undefined) {
          child1Index++;
        }
        child1[child1Index] = parent2[i];
      }
    }
    
    // Similar process for child2
    for (let i = start; i <= end; i++) {
      child2[i] = parent2[i];
    }
    
    let child2Index = 0;
    for (let i = 0; i < parent1.length; i++) {
      if (!child2.includes(parent1[i])) {
        while (child2[child2Index] !== undefined) {
          child2Index++;
        }
        child2[child2Index] = parent1[i];
      }
    }
    
    return [child1, child2];
  }

  private mutation(offspring: Location[][], rate: number): Location[][] {
    return offspring.map(route => {
      if (Math.random() < rate) {
        return this.swapMutation(route);
      }
      return route;
    });
  }

  private swapMutation(route: Location[]): Location[] {
    const mutated = [...route];
    const i = Math.floor(Math.random() * mutated.length);
    const j = Math.floor(Math.random() * mutated.length);
    
    [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    return mutated;
  }

  // Simulated Annealing helpers
  private generateRandomRoute(locations: Location[]): Location[] {
    return [...locations].sort(() => Math.random() - 0.5);
  }

  private generateNeighbor(route: Location[]): Location[] {
    const neighbor = [...route];
    const i = Math.floor(Math.random() * neighbor.length);
    const j = Math.floor(Math.random() * neighbor.length);
    
    [neighbor[i], neighbor[j]] = [neighbor[j], neighbor[i]];
    return neighbor;
  }

  // Ant Colony helpers
  private initializePheromones(size: number): number[][] {
    const pheromones: number[][] = [];
    for (let i = 0; i < size; i++) {
      pheromones[i] = new Array(size).fill(1);
    }
    return pheromones;
  }

  private buildAntRoute(locations: Location[], pheromones: number[][], alpha: number, beta: number): Location[] {
    const route: Location[] = [];
    const unvisited = [...locations];
    
    // Start with random location
    let current = unvisited.splice(Math.floor(Math.random() * unvisited.length), 1)[0];
    route.push(current);
    
    while (unvisited.length > 0) {
      const probabilities = this.calculateProbabilities(current, unvisited, pheromones, alpha, beta);
      const next = this.selectNextLocation(unvisited, probabilities);
      
      route.push(next);
      unvisited.splice(unvisited.indexOf(next), 1);
      current = next;
    }
    
    return route;
  }

  private calculateProbabilities(
    current: Location,
    candidates: Location[],
    pheromones: number[][],
    alpha: number,
    beta: number
  ): number[] {
    const probabilities: number[] = [];
    let total = 0;
    
    for (let i = 0; i < candidates.length; i++) {
      const distance = this.calculateDistance(current, candidates[i]);
      const pheromone = pheromones[0][i] || 1; // Simplified pheromone access
      const probability = Math.pow(pheromone, alpha) * Math.pow(1 / distance, beta);
      probabilities.push(probability);
      total += probability;
    }
    
    return probabilities.map(p => p / total);
  }

  private selectNextLocation(candidates: Location[], probabilities: number[]): Location {
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < candidates.length; i++) {
      cumulative += probabilities[i];
      if (cumulative >= random) {
        return candidates[i];
      }
    }
    
    return candidates[candidates.length - 1];
  }

  private updatePheromones(
    pheromones: number[][],
    routes: Location[][],
    evaporationRate: number,
    deposit: number
  ): void {
    // Evaporate pheromones
    for (let i = 0; i < pheromones.length; i++) {
      for (let j = 0; j < pheromones[i].length; j++) {
        pheromones[i][j] *= (1 - evaporationRate);
      }
    }
    
    // Deposit pheromones
    routes.forEach(route => {
      const fitness = this.calculateFitness(route, { algorithm: 'ant_colony' });
      const pheromoneAmount = deposit * fitness;
      
      for (let i = 0; i < route.length - 1; i++) {
        const from = route[i];
        const to = route[i + 1];
        // Simplified pheromone update
        pheromones[0][0] += pheromoneAmount;
      }
    });
  }

  // Database operations
  private async saveOptimizedRoutes(routes: Route[]): Promise<void> {
    try {
      for (const route of routes) {
        await prisma.route.create({
          data: {
            id: route.id,
            driverId: route.driverId,
            locations: JSON.stringify(route.locations),
            totalDistance: route.totalDistance,
            totalDuration: route.totalDuration,
            estimatedEarnings: route.estimatedEarnings,
            optimized: route.optimized,
            algorithm: route.algorithm,
            createdAt: route.createdAt,
          },
        });
      }
    } catch (error) {
      console.error('Error saving optimized routes:', error);
    }
  }

  // Public methods for route management
  async getOptimizedRoutes(driverId: string, limit: number = 10): Promise<Route[]> {
    try {
      const routes = await prisma.route.findMany({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return routes.map(route => ({
        id: route.id,
        driverId: route.driverId,
        locations: JSON.parse(route.locations),
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        estimatedEarnings: route.estimatedEarnings,
        optimized: route.optimized,
        algorithm: route.algorithm,
        createdAt: route.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching optimized routes:', error);
      return [];
    }
  }

  async deleteRoute(routeId: string): Promise<boolean> {
    try {
      await prisma.route.delete({
        where: { id: routeId },
      });
      return true;
    } catch (error) {
      console.error('Error deleting route:', error);
      return false;
    }
  }

  // Real-time route optimization for active deliveries
  async optimizeActiveDeliveries(driverId: string): Promise<OptimizationResult> {
    try {
      // Get active deliveries for the driver
      const activeDeliveries = await prisma.delivery.findMany({
        where: {
          driverId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      // Convert to locations
      const locations: Location[] = activeDeliveries.map(delivery => ({
        id: delivery.id,
        latitude: delivery.order.pickupLat || 0,
        longitude: delivery.order.pickupLng || 0,
        address: delivery.order.pickupAddress,
        type: 'pickup' as const,
        orderId: delivery.orderId,
        priority: delivery.order.total / 100, // Priority based on order value
        estimatedDuration: 15, // 15 minutes per pickup
      }));

      // Add delivery locations
      const deliveryLocations: Location[] = activeDeliveries.map(delivery => ({
        id: `${delivery.id}_delivery`,
        latitude: delivery.order.deliveryLat || 0,
        longitude: delivery.order.deliveryLng || 0,
        address: delivery.order.deliveryAddress,
        type: 'delivery' as const,
        orderId: delivery.orderId,
        priority: delivery.order.total / 100,
        estimatedDuration: 10, // 10 minutes per delivery
      }));

      const allLocations = [...locations, ...deliveryLocations];

      // Optimize routes
      return await this.optimizeRoutes(driverId, allLocations, {
        algorithm: 'hybrid',
        maxStopsPerRoute: 20,
        considerTimeWindows: true,
        weightDistance: 0.3,
        weightTime: 0.4,
        weightEarnings: 0.3,
      });
    } catch (error) {
      console.error('Error optimizing active deliveries:', error);
      return {
        success: false,
        routes: [],
        totalDistance: 0,
        totalDuration: 0,
        totalEarnings: 0,
        optimizationTime: 0,
        algorithm: 'hybrid',
      };
    }
  }
}

export const routeOptimizationService = new RouteOptimizationService();
