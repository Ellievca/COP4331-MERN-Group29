export function createStarterWorkspace() {
  const now = new Date().toISOString();
  const courses = [
    { id: 'cop4331', name: 'Software Engineering', code: 'COP4331', color: 'purple' },
    { id: 'cop3503', name: 'Computer Science II', code: 'COP3503', color: 'blue' },
    { id: 'cda3103', name: 'Computer Organization', code: 'CDA3103', color: 'peach' },
  ];
  const examples = [
    [
      'mern',
      'The MERN essentials',
      'From the database to the browser. Connect the dots in your full stack.',
      'cop4331',
      [
        ['What does MERN stand for?', 'MongoDB, Express, React, and Node.js.'],
        [
          'What is React responsible for in a MERN application?',
          'Rendering the user interface and managing client-side interactions and state.',
        ],
        [
          'What does an Express route connect?',
          'An HTTP method and URL path to the server-side code that handles the request.',
        ],
        [
          'Why should database credentials stay on the server?',
          'Frontend bundles are public. The server uses private credentials and exposes only the operations a user is authorized to perform.',
        ],
      ],
    ],
    [
      'patterns',
      'Design patterns, decoded',
      'A few familiar patterns for cleaner, more maintainable software.',
      'cop4331',
      [
        [
          'What problem does the Observer pattern solve?',
          'It lets subscribers react when another object changes without tightly coupling the objects.',
        ],
        [
          'What is the purpose of the Strategy pattern?',
          'To make a family of algorithms interchangeable behind a common interface.',
        ],
        [
          'What is separation of concerns?',
          'Organizing code so each part has a clear responsibility, reducing the impact of changes.',
        ],
        [
          'What does dependency injection provide?',
          'Dependencies are supplied to a component from outside, making them easier to replace and test.',
        ],
      ],
    ],
    [
      'graphs',
      'Graphs & traversal',
      'Find your way through vertices, edges, and everything in between.',
      'cop3503',
      [
        [
          'Which data structure is commonly used for breadth-first search?',
          'A queue. Vertices are explored in increasing distance from the starting vertex.',
        ],
        [
          'Which data structure is commonly used for depth-first search?',
          'A stack, either explicit or through recursive calls.',
        ],
        [
          'What is the running time of BFS with adjacency lists?',
          'O(V + E), where V is the number of vertices and E the number of edges.',
        ],
        [
          'When does Dijkstra’s shortest-path algorithm apply?',
          'When all edge weights are nonnegative.',
        ],
      ],
    ],
    [
      'complexity',
      'Big O, little by little',
      'Get comfortable with the cost of the code you write.',
      'cop3503',
      [
        [
          'What is the time complexity of binary search on a sorted array?',
          'O(log n). Each comparison eliminates approximately half of the remaining search range.',
        ],
        [
          'What does O(1) mean?',
          'The operation uses an amount of time bounded independently of the input size.',
        ],
        [
          'What is amortized analysis?',
          'Analyzing the average cost per operation over a sequence, including occasional expensive operations.',
        ],
        ['What is the worst-case time complexity of merge sort?', 'O(n log n).'],
      ],
    ],
    [
      'memory',
      'A little about memory',
      'Caches, locality, and what happens behind the scenes.',
      'cda3103',
      [
        [
          'What is temporal locality?',
          'Recently accessed data is likely to be accessed again soon.',
        ],
        [
          'What is spatial locality?',
          'Data near recently accessed data is likely to be accessed soon.',
        ],
        [
          'What is a cache miss?',
          'A requested item is absent from a cache and must be retrieved from a lower level of memory.',
        ],
        [
          'What is the purpose of virtual memory?',
          'To give processes an abstract address space, with mappings to physical memory and support for isolation.',
        ],
      ],
    ],
    [
      'testing',
      'Test with confidence',
      'Small checks that make a big difference.',
      'cop4331',
      [
        [
          'What is a unit test?',
          'A test of a small unit of behavior in isolation from unrelated systems.',
        ],
        [
          'What does an integration test verify?',
          'That multiple components work correctly together.',
        ],
        [
          'What is a regression test?',
          'A test that guards against the return of a previously fixed defect or broken behavior.',
        ],
        [
          'What is an end-to-end test?',
          'A test that exercises a complete user workflow across the application.',
        ],
      ],
    ],
  ];
  return {
    courses,
    decks: examples.map(([id, title, description, courseId, pairs]) => ({
      id,
      title,
      description,
      courseId,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      cardCount: pairs.length,
      cards: pairs.map(([front, back], index) => ({ id: `${id}-${index}`, front, back })),
    })),
    sessions: [],
  };
}
