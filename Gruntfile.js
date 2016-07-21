module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'build/<%= pkg.name %>.min.css': [ 'src/<%= pkg.name %>.css', 'src/reset.css' ]
        }
      }
    },
    jsdoc: {
      dist: {
        src: ['src/*.js'],
        options: {
          destination: 'doc',
          verbose: true
        }
      }
    },
    optimizePolyfiller: {
      options: {
        src: 'node_modules/webshim/js-webshim/dev/', //required
        features: 'forms mediaelement', //which features are used?

        // js-webshims/minified/polyfiller-custom.js
        dest: 'src/polyfiller-custom.js',
        //should existing uglify be extended to uglify custom polyfiller? default: false (grunt-contrib-uglify has to be installed)
        uglify: true,
        uglify_dest: 'build/polyfiller-custom.min.js',
        
        //should initially loaded files inlined into polyfiller? default: false (
        //depends on your pferformance strategy. in case you include polyfiller.js at bottom, this should be set true)
        inlineInitFiles: true,
        
        //only in case inlineInitFiles is true
        //which lang or langs are used on page?
        lang: 'en no',
        //forms feature option default: false
        customMessages: true,
        //forms-ext feature option default: false
        replaceUI: false,
        //is swfobject not used on site default: true (used only with mediaelement)
        includeSwfmini: false
      }
    },
    copy: {
      export: {
        files: [
          {
            // expand: true, 
            src: ['src/tablecreator.js', 'src/polyfiller-custom.js'],
            dest: '/Project/Nokkeltall/Nokkeltall/Scripts/tablecreator/',
          },{
            src: ['src/tablecreator.css', 'src/reset.css'],
            dest: '/Project/Nokkeltall/Nokkeltall/Content/tablecreator/',
          },{
            expand: true, 
            src: ['build/tablecreator.min.js', 'build/polyfiller-custom.min.js'],
            dest: '/Project/Nokkeltall/Nokkeltall/Scripts/tablecreator/',
          },{
            expand: true,
            src: ['build/tablecreator.min.css'],
            dest: '/Project/Nokkeltall/Nokkeltall/Content/tablecreator/',
          }
        ]
      }
    }

  });

  grunt.loadTasks('node_modules/webshim/grunt-tasks');

  // Load the plugins that provides the tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task(s).
  grunt.registerTask('default', ['uglify','cssmin','jsdoc']);
  grunt.registerTask('export_to_Nokkeltall', ['copy:export']);

  grunt.registerTask('polyfill', ['optimizePolyfiller']);
};
